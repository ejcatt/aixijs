import { configs, glossary } from './config';
export class UI {
	slider: HTMLInputElement;
	doc: HTMLDocument = document;
	params: any;

	getElementById(id: string): Element | null {
		return this.doc.getElementById(id);
	}

	getElementsByClassName(cl: string): HTMLCollectionOf<Element> {
		return this.doc.getElementsByClassName(cl);
	}

	showExplanation(exp: string): void {
		let md: HTMLElement | null = this.doc.getElementById(`${exp}_exp`);
		if (md) {
			md.style.display = 'block';
		}
	}

	clearExplanations(): void {
		let mds = <HTMLCollectionOf<HTMLDivElement>>this.getElementsByClassName('md');
		for (let i = 0; i < mds.length; i++) {
			let md = mds[i];
			if (md.id.endsWith('_exp')) {
				md.style.display = 'none';
			}
		}
	}

	clear(): void {
		for (let opt of ['env', 'agent']) {
			let div = this.getElementById(opt);
			if (!div) {
				continue;
			}
			while (div.firstChild) {
				div.removeChild(div.firstChild);
			}
		}
	}

	push(config: any) {
		let fixerino = (options: any, level: string, div: HTMLDivElement) => {
			for (let field in options) {
				if (field == 'type' ||
					field == 'model' ||
					field == 'discount' ||
					field == 'discountParams' ||
					field == 'tracer' ||
					field == 'modelParametrization' ||
					field == 'opponent' ||
					field == 'dist' ||
					field == 'transitions' ||
					field == 'rewards' ||
					field == 'groups' ||
					field == 'numStates' ||
					field == 'numActions' ||
					field == 'plan_caching' ||
					field == 'state_percepts' ||
					field[0] == '_') {
					continue;
				}

				// TODO use a handler idiom here; this function is huge
				// probably the worst code i've written in my life

				if (field == 'discounts') {
					let p = this.doc.createElement('p');
					let select = this.doc.createElement('select');
					select.id = 'discount-select';
					for (let name in options.discounts) {
						let discount = options.discounts[name];
						let opt = this.doc.createElement('option');
						opt.value = discount.name;
						opt.text = discount.name;
						select.add(opt);
					}

					let label = this.doc.createElement('label');
					label.innerText = 'Discount: ';

					p.appendChild(label);
					p.appendChild(select);
					p.title = field;
					div.appendChild(p);

					select.onchange = function () {
						for (let i = div.children.length - 1; i >= 0; i--) {
							let p = div.children[i];
							if ((<HTMLParagraphElement>p.children[0]).innerText.
								startsWith('agent.discount')) {
								div.removeChild(p);
							}
						}

						fixerino(options.discountParams[select.value], 'agent.discount', div);
					};

					fixerino(options.discountParams.GeometricDiscount, 'agent.discount', div);

					continue;
				}

				if (field == 'agents') {
					// make dropdown to pick agent
					let p = this.doc.createElement('p');
					let select = this.doc.createElement('select');
					select.id = 'agent-select';
					for (let name in options.agents) {
						let agent = options.agents[name];
						let opt = this.doc.createElement('option');
						opt.value = agent.name;
						opt.text = agent.name;
						select.add(opt);
					}

					let label = this.doc.createElement('label');
					label.innerText = `Agent: `;

					p.appendChild(label);
					p.appendChild(select);
					p.title = field;
					div.appendChild(p);
					continue;
				}

				if (typeof options[field] == 'object') {
					fixerino(options[field], level, div);
					continue;
				}

				let p = this.doc.createElement('p');
				let input = this.doc.createElement('input');

				input.type = 'number';
				input.className = 'param';
				input.name = field;
				input.id = field;
				input.value = options[field];
				input.required = true;
				input.min = Number.NEGATIVE_INFINITY.toString();
				input.max = Number.POSITIVE_INFINITY.toString();
				input.step = '0.01';

				let label = this.doc.createElement('label');
				try {
					label.innerText = `${level}.${glossary[field].label}:`;
					label.title = glossary[field].description;
				} catch (e) {
					label.innerText = `${level}.${field}`;
					label.title = '';
				}

				p.appendChild(label);
				p.appendChild(input);
				p.title = field;
				div.appendChild(p);
			}
		};

		for (let opt of ['env', 'agent']) {
			let div = <HTMLDivElement>this.getElementById(opt);
			let options = config[opt];
			fixerino(options, opt, div);
		}
	}

	pull(options: any) {
		let matchOpt = (options: any, f: string, v: number) => {
			for (let field in options) {
				if (field == f) {
					options[field] = v;
					return;
				}

				if (typeof options[field] == 'object') {
					matchOpt(options[field], f, v);
				}
			}
		};

		for (let opt of ['env', 'agent']) {
			let div = <HTMLDivElement>this.getElementById(opt);
			if (!div) {
				continue;
			}
			for (let i = 0; i < div.children.length; i++) {
				let p = <HTMLElement>div.children[i];
				// TODO
				let sel = <HTMLSelectElement>this.getElementById(p.title);

				if (p.title == 'agents') {
					options.agent.type = options.agent.agents[
						(<HTMLSelectElement>p.children[1]).value];
					continue;
				}

				if (p.title == 'discounts') {
					options.agent.discount = options.agent.discounts[
						(<HTMLSelectElement>p.children[1]).value];
					interface Dict {
						[x: string]: any;
					}
					let dp: Dict = {};
					for (let i = 0; i < div.children.length; i++) {
						let p = <HTMLElement>div.children[i];
						if ((<HTMLElement>p.children[0]).innerText.startsWith('agent.discount')) {
							let v = (<HTMLSelectElement>p.children[1]).value;
							dp[(<HTMLElement>p.children[1]).title] = v;
						}
					}

					options.agent.discountParam = dp;
					continue;
				}

				matchOpt(options[opt], p.title, parseFloat(sel.value));
			}
		}
	}

	start() {
		this.show('loading');
		this.show('cancel');
		this.hide('navigation');
		this.show('plots');
		this.hide('run');
		this.hide('back');
		this.slider = <HTMLInputElement>this.getElementById('slider')!;
	}

	end() {
		this.hide('loading');
		this.hide('cancel');
		this.show('navigation');
		this.show('run');
		this.show('back');
	}

	show(x: string) {
		(<HTMLElement>this.getElementById(x)!).style.display = 'block';
	}

	hide(x: string) {
		(<HTMLElement>this.getElementById(x)!).style.display = 'none';
	}
}

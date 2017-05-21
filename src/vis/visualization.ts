import { UI } from './../ui';
import { Trace } from './../x/trace';
import * as d3 from 'd3';
import { Time } from '../x/x';

export class Visualization {
	trace: Trace;
	ui: UI;
	svg: d3.Selection<any, {}, HTMLElement, any>;
	interval: number;
	t: Time;
	T: Time;
	constructor(trace: Trace, ui: UI) {
		this.ui = ui;
		this.trace = trace;
		this.T = trace.iter;
		this.remove();

		this.svg = d3.select('#gridvis')
			.append('svg')
			.attr('id', 'vis_svg');

		ui.slider.max = this.T.toString();
	}

	pause() {
		clearInterval(this.interval);
	}

	run(speed: number) {
		this.pause();
		this.interval = setInterval(_ => {
			this.t++;
			this.draw();
		}, speed);
	}

	jumpTo(t: Time) {
		this.t = t;
		this.draw();
	}

	reset() {
		this.pause();
		this.jumpTo(0);
	}

	remove() {
		this.pause();
		d3.select('#vis_svg').remove();
	}

	private draw() {
		if (this.t > this.T) {
			this.t = this.T;
			this.pause();
		}

		this.updateUI();
		this.updateAgent();
		this.updateEnv();
	}

	private updateUI() {
		this.ui.slider.value = this.t.toString();
	}

	protected updateAgent() {
		return;
	}

	protected updateEnv() {
		return;
	}
}

import { Gridworld } from './environments/gridworld';
import { BayesExp } from './agents/bayesexp';
import { MDLAgent } from './agents/mdl';
import { ThompsonAgent } from './agents/thompson';
import { BayesAgent } from './agents/bayes';
import { SquareKSA, ShannonKSA, KullbackLeiblerKSA } from './agents/ksa';
import { Plot } from './vis/plot';
import { Trace } from './x/trace';
import { Agent } from './agents/agent';
import {
	Environment,
	EnvironmentConstructor
} from './environments/environment';
import { Visualization } from './vis/visualization';
import { UI } from './ui';
import { Util } from './x/util';
import { Time, Vector, Config, Options } from './x/x';
import * as seedrandom from 'seedrandom';

interface Log {
	rewards: Vector;
	explored: Vector;
	options: Options;
	agent: string;
	cycles: Time;
	runtime: Time;
	seed: string;
	samples?: number;
	horizon?: number;
}

interface Result {
	[x: string]: Log[];
}

interface Math {
	seedrandom(seed?: string): void;
}

class Demo {
	agent: Agent;
	env: Environment;
	trace: Trace;

	ui: UI = new UI();
	vis: Visualization;
	plots: Plot[];

	enableVis: boolean;
	config: any;

	t0: Time;

	cancel: boolean;

	experimentNumber: number = 0;

	constructor() { }


	new(config: Config) {
		this.config = config;
		if (this.vis) this.vis.pause();

		// get defaults
		for (let opt of ['env', 'agent']) {
			let lst = [];
			for (let ptr = config[opt].type; ptr; ptr = ptr.__proto__) {
				if (!ptr.params) {
					continue;
				}

				for (let p of ptr.params) {
					lst.push(p);
				}
			}

			for (let i = lst.length - 1; i >= 0; i--) {
				let v = config[opt][lst[i].field];
				if (!v) {
					config[opt][lst[i].field] = lst[i].value;
				}
			}
		}

		this.ui.hide('picker');
		this.ui.show('setup');

		this.ui.clear();
		this.ui.push(config);

		this.ui.clearExplanations();
		if (!config.vis.exps) return;
		for (let exp of config.vis.exps) {
			this.ui.showExplanation(exp);
		}

		let label = <HTMLElement>this.ui.getElementById('setup_label')!;
		label.innerText = `Setup: ${config.name}`;

		if (!config.exps) return;

		for (let exp of config.exps) {
			this.ui.showExplanation(exp);
		}

	}

	run(env?: Environment, enableVis = true) {
		this.enableVis = enableVis;

		// new: class defaults -> config -> ui
		// run: ui -> options -> env/agent
		if (this.vis) this.vis.remove();
		let options = Util.deepCopy(this.config);
		this.ui.pull(options);
		this.env = env ? env : new options.env.type(options.env);

		if (options.env._mods) {
			options.env._mods(this.env);
		}

		options.agent.model = this.env.makeModel(options.agent.model,
			options.agent.modelParametrization);
		options.agent.numActions = this.env.numActions;
		options.agent.minReward = this.env.minReward;
		options.agent.maxReward = this.env.maxReward;

		options.agent.discountParam = options.agent.discountParam || { gamma: 0.99 };

		this.agent = new options.agent.type(options.agent);
		if (options.agent._mods) {
			options.agent._mods(this.agent);
		}

		this.trace = new this.agent.tracer(options.agent.cycles);
		this.plots = [];

		Plot.clearAll();
		for (let P of this.trace.plots) {
			this.plots.push(new P(this.trace));
		}

		for (let P of this.env.plots) {
			this.plots.push(new P(this.trace));
		}

		let update = (trace: Trace) => {
			for (let p of this.plots) {
				p.dataUpdate(trace);
			}
		};

		let callback = () => {
			this.ui.end();
			this.cancel = false;
			let frames = this.trace.iter;
			let second = Util.roundTo((performance.now() - this.t0) / 1000, 2);
			let fps = Util.roundTo(frames / second, 2);
			this.trace.runtime = second;
			this.trace.fps = fps;
			console.log(`${frames} cycles, ${second} seconds (${fps} fps)`);

			if (enableVis && options.vis) {
				this.vis = new options.vis(this.env, this.trace, this.ui);
				this.vis.reset();
			}
		};
		if (enableVis) {
			this.ui.start();
		}

		this.t0 = performance.now();
		this.simulate(update, callback);
	}

	private simulate(update: (trace: Trace) => void, callback: () => void) {
		let trace = this.trace;
		let agent = this.agent;
		let env = this.env;

		let e = env.generatePercept();
		let a = env.noop;

		trace.log(agent, env, a, e);
		agent.update(a, e);

		let cycle = () => {
			trace.log(agent, env, a, e);
			a = agent.selectAction(e);
			env.perform(a);
			e = env.generatePercept();
			agent.update(a, e);
		};

		let loop: () => void;
		if (this.enableVis) {
			loop = () => {
				if (trace.iter >= trace.T || this.cancel) {
					callback();
					return;
				}

				cycle();
				update(trace);
				setTimeout(loop, 0);
			};
		} else {
			loop = () => {
				while (true) {
					if (trace.iter >= trace.T) {
						callback();
						break;
					}

					cycle();
				}
			};
		}


		loop();
	}

	stop() {
		this.cancel = true;
	}

	reset() {
		if (this.vis) this.vis.remove();
		this.ui.end();
		this.ui.hide('navigation');
		this.ui.hide('plots');
		this.ui.show('picker');
		this.ui.hide('setup');
		this.ui.clearExplanations();
	}

	experiment(dems: Config[], params: Config) {
		this.reset();
		this.experimentNumber++;
		if (!params) {
			// some defaults
			params = {
				runs: 1,
				frac: 1,
				seed: 'aixi',
				env: { N: 10 },
				agent: { cycles: 200 },
			};
		}

		let results: Result;
		results = {};
		let runs = params.runs;
		let frac = params.frac;
		let seed = params.seed;
		let num = 1;
		var t0 = performance.now();
		for (let cfg of dems) {
			let config = Util.deepCopy(cfg);
			if (params.env) {
				for (let param_name in params.env) {
					config.env[param_name] = params.env[param_name];
				}
			}
			if (params.agent) {
				for (let param_name in params.agent) {
					config.agent[param_name] = params.agent[param_name];
				}
			}
			if (config.agent.model) {
				console.log(`Running ${config.agent.type.name}` +
					` with model ${config.agent.model.name} on ${config.env.type.name}.`);
			} else {
				console.log(`Running ${config.agent.type.name}` +
					` on ${config.env.type.name}.`);
			}

			seedrandom(seed);
			let logs = [];
			let env: Environment = this.env;
			this.new(config);
			for (let i = 0; i < runs; i++) {
				console.log(`    run ${i + 1} of ${runs}...`);
				if (i > 0) {
					env = new (<EnvironmentConstructor>env.constructor)(env.options);
					if (env.constructor == Gridworld) {
						(<Gridworld>env).isSolvable(); // TODO: decouple GW
					}

					this.run(env, false);
				} else {
					this.run(undefined, false);
					env = this.env;
				}

				var rew = [];
				var exp = [];
				for (var j = 0; j < config.agent.cycles; j++) {
					if (j % frac == 0) {
						rew.push(this.trace.averageReward[j]);
						exp.push(this.trace.explored[j]);
					}
				}

				let log: Log;
				log = {
					rewards: rew,
					explored: exp,
					options: Util.deepCopy(this.config),
					agent: this.config.agent.type.name,
					cycles: this.trace.iter,
					runtime: this.trace.runtime,
					seed: seed
				};

				// TODO: fix design here
				if (this.agent.constructor == BayesAgent ||
					SquareKSA ||
					ShannonKSA ||
					KullbackLeiblerKSA ||
					ThompsonAgent ||
					MDLAgent ||
					BayesExp) {
					log.samples = (<BayesAgent>this.agent).samples;
					log.horizon = (<BayesAgent>this.agent).horizon;
				}

				logs.push(log);
			}
			let key: string;
			if (config.name in results) {
				key = `${config.name}-${num}`;
				num++;
			} else {
				key = config.name;
			}
			results[key] = logs;
		}
		this.reset();

		console.log(`Done! Total time elapsed:` +
			` ${Math.floor(performance.now() - t0) / 1000} seconds.`);

		let json = JSON.stringify(results);
		let blob = new Blob([json], { type: 'application/json' });

		let a = document.createElement('a');
		a.download = `results-${this.experimentNumber}.json`;
		a.href = URL.createObjectURL(blob);
		a.textContent = `Download results-${this.experimentNumber}.json`;
		document.body.appendChild(a);

		return results;
	}
}

export const demo = new Demo();
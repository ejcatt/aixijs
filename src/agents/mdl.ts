import { Model } from './../models/model';
import { BayesMixture } from './../models/mixture';
import { BayesAgent } from './bayes';
import { MDLTrace } from '../x/trace';
import { ExpectimaxTree } from '../planners/mcts';
import { Vector, Action, Percept, Index } from '../x/x';

export class MDLAgent extends BayesAgent {
	idx: number = 0;
	model: BayesMixture;
	sigma: Model;
	mappings: [Model, Index][];

	constructor(options: any) {
		super(options);
		this.tracer = MDLTrace;
		let C = this.model.modelClass.length;

		for (let i = 0; i < C; i++) {
			this.mappings.push([this.model.modelClass[i], i]);
		}

		let K = (model: Model) => JSON.stringify(model).length;

		this.mappings.sort((m, n) => {
			let d = K(m[0]) - K(n[0]);
			return d || m[1] - n[1];
		});

		let w = [...this.model.weights];
		for (let i = 0; i < C; i++) {
			w[i] = this.model.weights[this.mappings[i][1]];
		}

		this.model.weights = w;
		this.sigma = this.model.modelClass[this.idx].copy();
		this.sigma.bayesUpdate = function () { };

		this.planner = new ExpectimaxTree(options,
			this.sigma, this.reward, this.discount);
	}

	update(a: Action, e: Percept) {
		super.update(a, e);
		this.sigma.perform(a);
		if (this.model.weights[this.idx] != 0) {
			return;
		}

		for (; this.idx < this.model.modelClass.length; this.idx++) {
			if (this.model.weights[this.idx] != 0) {
				this.sigma = this.model.modelClass[this.idx].copy();
				this.sigma.bayesUpdate = function () { };

				this.planner = new ExpectimaxTree(this.options,
					this.sigma,
					this.reward,
					this.discount);
				return;
			}
		}

		// we shouldn't get here
		throw 'Cromwell violation! Agent is in Bayes Hell!';
	}
}

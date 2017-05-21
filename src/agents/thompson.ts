import { ExpectimaxTree } from './../planners/mcts';
import { BayesMixture } from './../models/mixture';
import { Model } from './../models/model';
import { Percept } from './../x/x';
import { ThompsonTrace } from './../x/trace';
import { BayesAgent } from './bayes';
import { Action } from '../x/x';
import { Util } from '../x/util';

export class ThompsonAgent extends BayesAgent {
	rho: Model;
	model: BayesMixture;
	constructor(options: any) {
		super(options);
		this.sample();
		this.tracer = ThompsonTrace;
	}

	private sample() {
		let idx = Util.sample(this.model.weights);
		this.rho = this.model.modelClass[idx].copy();
		this.rho.bayesUpdate = function () { };

		this.planner = new ExpectimaxTree(this.options,
			this.rho,
			this.reward,
			this.discount);
	}

	update(a: Action, e: Percept) {
		super.update(a, e);
		this.rho.perform(a);
	}

	selectAction(e: Percept) {
		if (this.age % this.horizon == 0) {
			this.sample();
		} else {
			this.planner.reset(this.lastAction, e, this.age);
		}

		return this.planner.bestAction();
	}
}

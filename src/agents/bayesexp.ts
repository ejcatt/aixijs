import { GeometricDiscount } from './../x/discount';
import { BayesMixture } from './../models/mixture';
import { Percept, Action } from './../x/x';
import { BayesExpTrace } from './../x/trace';
import { ExpectimaxTree } from './../planners/mcts';
import { KullbackLeiblerKSA } from './ksa';
import { BayesAgent } from './bayes';

export class BayesExp extends BayesAgent {
	explore: boolean;
	epsilon: number;
	bayesAgent: BayesAgent;
	IGAgent: KullbackLeiblerKSA;
	// TODO: this repeats Agent.defaults. is there another way?
	static defaults = {
		cycles: 2e2,
		discount: GeometricDiscount,
		discountParams: {
			gamma: 0.99
		},
		epsilon: 0.04,
		horizon: 6,
		samples: 600,
		ucb: 1.4,
		model: BayesMixture,
		modelParametrization: 'goal'
	};
	constructor(options: any) {
		super(options);
		this.explore = false;
		this.epsilon = options.epsilon;
		this.bayesAgent = new BayesAgent(options);
		this.IGAgent = new KullbackLeiblerKSA(options);
		this.IGAgent.model = this.bayesAgent.model;
		this.model = this.bayesAgent.model;
		this.planner = new ExpectimaxTree(options,
			this.model,
			this.reward,
			this.discount);
		this.tracer = BayesExpTrace;
	}

	selectAction(e: Percept): Action {
		if (this.age % this.horizon == 0) {
			let V = this.IGAgent.planner.getValueEstimate();
			this.explore = V > this.epsilon;
		}

		if (this.explore) {
			return this.IGAgent.selectAction(e);
		}

		return this.bayesAgent.selectAction(e);
	}

	update(a: Action, e: Percept) {
		this.bayesAgent.update(a, e);
		this.informationGain = this.bayesAgent.informationGain;
	}
}

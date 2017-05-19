import {SimpleAgent} from "./agent";
import {Model} from "../models/model"
import {Planner} from "../planners/planner"
import {ExpectimaxTree} from "../planners/mcts"
import {BayesTrace} from "../util/trace"

class BayesAgent extends SimpleAgent {
	samples: number;
	timeout: number;
	horizon: number;
	ucb: number;
	maxReward: number;
	minReward: number;
	informationGain: number;
	model: Model;
	planner: Planner;
	constructor(options) {
		super(options);
		this.samples = options.samples;
		this.timeout = options.timeout;
		this.horizon = options.horizon;
		this.ucb = options.ucb;
		this.maxReward = options.maxReward;
		this.minReward = options.minReward;

		let planCaching = options.plan_caching || true;

		// TODO assert options OK
		this.informationGain = 0;
		this.tracer = options.tracer || BayesTrace;
		this.model = options.model;
		this.planner = new ExpectimaxTree(this, this.model, !planCaching);
	}

	update(a, e) {
		super.update(a, e);
		this.model.save();
		this.model.update(a, e);
		this.informationGain = Util.entropy(this.model.savedWeights) - Util.entropy(this.model.weights);
	}

	selectAction(e) {
		if (this.informationGain) {
			this.planner.reset(); // TODO remove :)
		} else {
			this.planner.prune(this.last_action, e);
		}

		let a = this.planner.bestAction();
		this.plan = this.planner.getPlan();

		return a;
	}
}

BayesAgent.params = [
	{ field: 'horizon', value: 6 },
	{ field: 'samples', value: 600 },
	{ field: 'ucb', value: 0.5 },
	{ field: 'model', value: BayesMixture },
	{ field: 'modelParametrization', value: 'goal' },
];

import { Environment } from './../environments/environment';
import { Model } from '../models/model';
import { Action, Percept, Reward, Time } from '../x/x';
import { Util } from '../x/util';
import { Discount } from '../x/discount';

export class ExpectimaxTree {
	model: Model | Environment;
	horizon: number;
	ucb: number;
	samples: number;
	timeout: number;
	totalSamples: number;
	rewRange: Reward;
	minReward: Reward;
	numActions: Action;
	root: DecisionNode;
	sampled: boolean;
	reward: (e: Percept, dfr: number) => Reward;
	discount: Discount;

	constructor(options: any,
		model: Model | Environment,
		rewardFunction: (e: Percept, dfr: number) => Reward,
		discountFunction: (dfr: Time, t: Time) => number) {
		this.model = model;
		this.horizon = options.horizon;
		this.ucb = options.ucb;
		this.minReward = options.minReward;
		this.rewRange = options.maxReward - options.minReward;
		this.numActions = options.numActions;
		this.samples = options.samples;
		this.timeout = options.timeout;
		this.totalSamples = 0;
		this.reward = rewardFunction;
		this.discount = discountFunction;

		this.reset();
	}

	getValueEstimate() {
		if (!this.sampled) {
			this.model.save();
			if (this.timeout) {
				// time budget
				var t0 = performance.now();
				var n = 0;
				while (performance.now() - t0 < this.timeout) {
					this.root.sample(this, 0);
					this.model.load();
					n++;
				}
				this.totalSamples += n;
			} else {
				// sample budget
				for (let iter = 0; iter < this.samples; iter++) {
					this.root.sample(this, 0);
					this.model.load();
				}
			}

			this.sampled = true;
		}
		// TODO: ???
		return (this.root.mean / this.horizon - this.minReward) / this.rewRange;
	}

	bestAction(): Action {
		this.getValueEstimate();

		return Util.argmax(this.root, (n, a) => {
			let child = n.getChild(a);
			return child ? child.mean : 0;
		}, this.numActions);
	}

	getPlan(): Action[] {
		let current = this.root;
		let ret = [];
		while (current) {
			let a = Util.argmax(current, (n, a) => {
				let child = n.getChild(a);
				return child ? child.mean : 0;
			}, this.numActions);

			ret.push(a);
			let chanceNode = current.getChild(a);

			if (!chanceNode) {
				return ret;
			}

			let child = null;
			let maxVisits = 0;
			for (let [key, val] of chanceNode.children) {
				if (val.visits > maxVisits) {
					child = val; // No tie-breaking for now
					maxVisits = val.visits;
				}
			}

			current = child!;
		}

		return ret;
	}

	rollout(horizon: number, dfr: number): Reward {
		var reward = 0;
		for (var i = dfr; i <= horizon; i++) {
			var a = Math.floor(Math.random() * this.numActions);
			this.model.perform(a);
			var e = this.model.generatePercept();
			this.model.bayesUpdate(a, e);
			reward += this.reward(e, i);
		}

		return reward;
	}

	private fullReset(): void {
		this.root = new DecisionNode(null, this.numActions);
		this.sampled = false;
	}

	reset(a?: Action, e?: Percept, t?: number): void {
		this.rewRange = this.discount(0, t) * (this.rewRange);
		if (!a) {
			this.fullReset();
			return;
		}

		let cn = this.root.getChild(a);
		if (!cn) {
			this.fullReset();
			return;
		}

		this.root = cn.getChild(e!, this)!;
		if (!this.root) {
			this.fullReset();
			return;
		}

		this.sampled = false;
	}
}

class DecisionNode {
	visits: number;
	mean: number;
	percept: Percept | null;
	children: ChanceNode[];
	nChildren: number;
	U: number[];
	constructor(e: Percept | null, numActions: Action) {
		this.visits = 0;
		this.mean = 0;
		this.percept = e;
		this.children = new Array(numActions);
		this.nChildren = 0;
		this.U = Util.randInts(numActions);
	}

	private addChild(a: Action) {
		this.children[a] = new ChanceNode(a);
	}

	getChild(a: Action): ChanceNode {
		return this.children[a];
	}

	private selectAction(tree: ExpectimaxTree, dfr: number): Action {
		let a;
		if (this.nChildren != tree.numActions) {
			a = this.U[this.nChildren];
			this.addChild(a);
			this.nChildren++;
		} else {
			let max = Number.NEGATIVE_INFINITY;
			for (let action = 0, A = tree.numActions; action < A; action++) {
				let child = this.getChild(action);
				let normalization = (tree.horizon - dfr + 1) * tree.rewRange;
				let value = child.mean / normalization + tree.ucb *
					Math.sqrt(Math.log2(this.visits) / child.visits);
				if (value > max) {
					max = value;
					a = action;
				}
			}
		}
		Util.assert(a != null);

		return a!;
	}

	sample(tree: ExpectimaxTree, dfr: number): Reward {
		let reward = 0;
		if (dfr > tree.horizon) {
			return 0;
		} else if (this.visits == 0) {
			reward = tree.rollout(tree.horizon, dfr);
		} else {
			let action = this.selectAction(tree, dfr);
			reward = this.getChild(action).sample(tree, dfr);
		}

		this.mean = (1 / (this.visits + 1)) * (reward + this.visits * this.mean);
		this.visits++;
		return reward;
	}
}

class ChanceNode {
	visits: number;
	mean: number;
	children: Map<Number, DecisionNode>;
	action: Action;

	constructor(action: Action) {
		this.visits = 0;
		this.mean = 0;
		this.children = new Map();
		this.action = action;
	}

	private addChild(e: Percept, tree: ExpectimaxTree) {
		this.children.set(e.obs * tree.rewRange + e.rew,
			new DecisionNode(e, tree.numActions));
	}

	getChild(e: Percept, tree: ExpectimaxTree) {
		return this.children.get(e.obs * tree.rewRange + e.rew);
	}

	sample(tree: ExpectimaxTree, dfr: Time) {
		let reward = 0;
		if (dfr > tree.horizon) {
			return reward;
		} else {
			tree.model.perform(this.action);
			let e = tree.model.generatePercept();
			tree.model.bayesUpdate(this.action, e);
			if (!this.getChild(e, tree)) {
				this.addChild(e, tree);
			}

			reward = tree.reward(e, dfr) +
				this.getChild(e, tree)!.sample(tree, dfr + 1);
		}

		this.mean = (1 / (this.visits + 1)) * (reward + this.visits * this.mean);
		this.visits++;
		return reward;
	}
}

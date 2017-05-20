import { GeometricDiscount } from './../x/discount';
import { Percept } from './../x/x';
import { Agent, SimpleAgent } from './agent';
import { TabularTrace } from '../x/trace';
import { Util } from '../x/util';
import { QTable } from '../x/qtable';
import { Action, Observation } from '../x/x';

export class TabularAgent extends SimpleAgent {
	epsilon: number;
	alpha: number;
	Q: QTable;
	lastObs: Observation;
	static defaults = {
		cycles: 2e2,
		discount: GeometricDiscount,
		discountParams: {
			gamma: 0.99
		},
		alpha: 0.9,
		epsilon: 0.05,
		model: QTable
	};
	constructor(options: any) {
		super(options);
		this.epsilon = options.epsilon;
		this.alpha = options.alpha;
		this.Q = options.model;
		this.tracer = TabularTrace;

	}

	selectAction(e: Percept) {
		if (Math.random() < this.epsilon) {
			return Util.randi(0, this.numActions);
		}

		return Util.argmax(this.Q, (q, a) => q.get(e.obs, a), this.numActions);
	}

	update(a: Action, e: Percept) {
		super.update(a, e);
		let old = this.Q.get(this.lastObs, a);
		let Q = old +
			this.alpha * (
				e.rew + this.discount(1) * this.Q.get(e.obs, this.TDUpdate(e)) - old
			);
		this.Q.set(this.lastObs, a, Q);
		this.lastObs = e.obs;
	}

	protected TDUpdate(e: Percept): Action {
		throw 'not implemented';
	}
}

export class QLearn extends TabularAgent {
	protected TDUpdate(e: Percept): Action {
		return Util.argmax(this.Q, (q, a) => q.get(e.obs, a), this.numActions);
	}
}

export class SARSA extends TabularAgent {
	protected TDUpdate(e: Percept): Action {
		return this.selectAction(e);
	}
}

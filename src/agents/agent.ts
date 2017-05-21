import { Trace } from '../x/trace';
import { Discount, GeometricDiscount } from '../x/discount';
import { Action, Reward, Percept, Time } from '../x/x';
import { Util } from '../x/util';

export interface Agent {
	selectAction(e: Percept): Action;
	update(a: Action, e: Percept): void;
	reward(e: Percept, dfr: number): Reward;
}

export class SimpleAgent {
	numActions: Action;
	tracer: new (T: Time) => Trace;
	discount: Discount;
	options: any;
	age: number;
	lastAction: Action;
	static defaults = {
		cycles: 2e2,
		discount: GeometricDiscount,
		discountParams: {
			gamma: 0.99
		}
	};


	constructor(options: any) {
		this.numActions = options.numActions;
		this.tracer = Trace;
		this.age = 0;
		this.discount = new options.discount(options.discountParam);
		this.lastAction = 0;
		this.options = Util.deepCopy(options);
	}

	selectAction(e: Percept): Action {
		return Math.floor(Math.random() * this.numActions);
	}

	update(a: Action, e: Percept): void {
		this.lastAction = a;
		this.age++;
	}

	reward(e: Percept, dfr: number): Reward {
		return this.discount(dfr, this.age) * this.utility(e);
	}

	protected utility(e: Percept): Reward {
		return e.rew;
	}
}

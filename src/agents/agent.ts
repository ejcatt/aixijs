import {Trace, BaseTrace} from "../util/trace";
import {Discount, GeometricDiscount} from "../util/discount";
import {Action, Reward, Percept} from "../util/x"
import {Util} from "../util/util";

export interface Agent {
	selectAction(e: Percept): Action;
	update(a: Action, e: Percept);
	reward(e: Percept, dfr: number): Reward;
}

export class SimpleAgent {
	numActions: Action;
	tracer: Trace;
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


	constructor(options) {
		this.numActions = options.numActions;
		this.tracer = BaseTrace;
		this.age = 0;
		this.discount = new options.discount(options.discountParam);
		this.lastAction = null;
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
		return this.discount(dfr, this.age) * this._utility(e);
	}

	_utility(e: Percept): Reward {
		return e.rew;
	}
}

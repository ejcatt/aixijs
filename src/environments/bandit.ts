import { QTable } from '../x/qtable';
import { Environment } from './environment';
import { Percept } from '../x/x';
import { Index, Action } from '../x/x';
import { Util } from '../x/util';

export class Bandit implements Environment {
	actions: Array<any>;
	arm: Index;
	visited: number;
	options: any;
	numStates: number = 0;
	numActions: number = 0;
	noop: number;
	reward: number = 0;
	plots: any;
	constructor(options: any) {
		this.options = Util.deepCopy(options);
		this.actions = [];
		for (let param of options._params) {
			this.actions.push(new options.dist(param));
			this.numActions++;
		}

		this.arm = 0;
	}

	perform(action: Action) {
		this.arm = action;
	}

	generatePercept(): Percept {
		return {
			obs: this.arm,
			rew: this.actions[this.arm].sample(),
		};
	}

	conditionalDistribution(e: Percept) {
		return this.actions[this.arm].prob();
	}

	getState(): Index {
		return this.arm;
	}

	makeModel(kind: string, parametrization: string) {
		return new QTable(10, this.actions.length);
	}

	save() { }

	load() { }
}

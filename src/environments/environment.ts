import { Action, Percept } from '../x/x';
import { Util } from '../x/util';

export interface Environment {
	visited: number;
	numStates: number;
	numActions: Action;
	noop: Action;
	reward: number; // TODO refactor
	options: any;
	plots: object[]; // TODO refactor

	perform(action: Action): void;
	generatePercept(): Percept;
	conditionalDistribution(e: Percept): number;
	getState(): any;
	save(): void;
	load(): void;
}

// export class BaseEnvironment implements Environment {
// 	constructor(options: any) {
// 		this.reward = 0;
// 		this.options = Util.deepCopy(options);
// 		this.plots = [];
// 	}
// }

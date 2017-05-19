import {Action, Percept} from "../util/x";
import {Util} from "../util/util";

export interface Environment {
	perform(action: Action): void;
	generatePercept(): Percept;
	conditionalDistribution(e: Percept): number;
	save(): void;
	load(): void;
}

export class BaseEnvironment {
	reward: number // TODO refactor
	noop: Action;
	options: object;
	plots: object[]; // TODO refactor
	constructor(options) {
		this.reward = 0;
		this.options = Util.deepCopy(options);
		this.plots = [];
	}
}

import { QTable } from './../x/qtable';
import { Model } from './../models/model';
import { Action, Percept, Probability, Reward, Config } from '../x/x';
import { Util } from '../x/util';
import { PlotConstructor } from '../vis/plot';

export type EnvironmentConstructor = new (config: Config) => Environment;

export interface Environment {
	visited: number;
	numStates: number;
	numActions: Action;
	minReward: Reward;
	maxReward: Reward;
	noop: Action;
	reward: number; // TODO refactor
	options: any;
	plots: PlotConstructor[];

	perform(action: Action): void;
	generatePercept(): Percept;
	conditionalDistribution(e: Percept): Probability;
	getState(): any;
	save(): void;
	load(): void;
	copy(): Environment;

	makeModel(type: string, parametrization: string): Model | QTable;

	// TODO: probably refactor and resolve Model <--> Environment
	update(a: Action, e: Percept): void;
	bayesUpdate(a: Action, e: Percept): void;
}

// export class BaseEnvironment implements Environment {
// 	constructor(options: any) {
// 		this.reward = 0;
// 		this.options = Util.deepCopy(options);
// 		this.plots = [];
// 	}
// }

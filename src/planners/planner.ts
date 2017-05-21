import { Environment } from './../environments/environment';
import { Action, Percept, Time, Reward } from '../x/x';
import { Model } from '../models/model';

export interface Planner {
	model: Model | Environment;
	bestAction(): Action;
	reset(a: Action, e: Percept, t: Time): void;
	getPlan(): Action[];
	getValueEstimate(): Reward;
}
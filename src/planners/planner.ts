import { Action, Percept, Time } from '../x/x';
import { Model } from '../models/model';

export interface Planner {
	model: Model;
	bestAction(): Action;
	reset(a: Action, e: Percept, t: Time): void;
	getPlan(): Action[];
}
import { Action, Percept } from '../x/x';

export interface Model {
	update(a: Action, e: Percept): void;
	bayesUpdate(a: Action, e: Percept): void; // TODO: rename?
	perform(a: Action): void;
	generatePercept(): Percept;
	conditionalDistribution(e: Percept): number;
	save(): void;
	load(): void;
	copy(): Model;
	infoGain(): number;
	entropy(): number;
	log(): any;
}
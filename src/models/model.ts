import { Action, Percept } from '../x/x';

export interface Model {
	update(a: Action, e: Percept): void;
	perform(a: Action): void;
	generatePercept(): Percept;
	conditionalDistribution(e: Percept): number;

	save(): void;
	load(): void;
	copy(): Model;
	log(): any;

	bayesUpdate(a: Action, e: Percept): void;
	infoGain(): number;
	entropy(): number;

}
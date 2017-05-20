import { Observation, Action } from './x';
import { Util } from './util';

export class QTable {
	table: Array<Float32Array>;
	numStates: number;
	numActions: number;
	constructor(numStates: number, numActions: number, initialQ = 0) {
		this.table = new Array(numStates);
		for (let i = 0; i < numStates; i++) {
			this.table[i] = new Float32Array(numActions);
			for (let j = 0; j < numActions; j++) {
				this.table[i][j] = initialQ;
			}
		}
		this.numActions = numActions;
		this.numStates = numStates;
	}

	get(s: Observation, a: Action): number {
		return this.table[s][a];
	}

	set(s: Observation, a: Action, value: number) {
		this.table[s][a] = value;
	}

	copy(): QTable {
		let qt = new QTable(this.numStates, this.numActions);
		qt.table = Util.arrayCopy(this.table);

		return qt;
	}
}

import { Percept } from './../x/x';
import { BayesAgent } from './bayes';

export class SquareKSA extends BayesAgent {
	constructor(options: any) {
		super(options);
		this.minReward = -1;
		this.maxReward = 0;
	}

	protected utility(e: Percept) {
		return -1 * this.model.conditionalDistribution(e);
	}
}

export class ShannonKSA extends BayesAgent {
	constructor(options: any) {
		super(options);
		this.minReward = 0;
		this.maxReward = 1000; // TODO fix magic no
	}

	protected utility(e: Percept) {
		return -1 * Math.log2(this.model.conditionalDistribution(e));
	}
}

export class KullbackLeiblerKSA extends BayesAgent {
	constructor(options: any) {
		super(options);
		this.maxReward = 0;
		this.minReward = this.model.entropy();
	}

	protected utility(e: Percept) {
		return this.model.infoGain();
	}
}

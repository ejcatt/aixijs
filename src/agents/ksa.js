class SquareKSA extends BayesAgent {
	constructor(options) {
		super(options);
		this.minReward = -1;
		this.maxReward = 0;
	}

	utility(e) {
		return -1 * this.model.conditionalDistribution(e);
	}
}

class ShannonKSA extends BayesAgent {
	constructor(options) {
		super(options);
		this.minReward = 0;
		this.maxReward = 1000; // TODO fix magic no
	}

	utility(e) {
		return -1 * Math.log2(this.model.conditionalDistribution(e));
	}
}

class KullbackLeiblerKSA extends BayesAgent {
	constructor(options) {
		super(options);
		this.maxReward = 0;
		this.minReward = this.model.entropy()
	}

	utility(e) {
		return this.model.infoGain()
	}
}

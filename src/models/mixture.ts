import {Model} from "./model"
import {Util} from "../util/util"
import {Action, Percept} from "../util/x"

class BayesMixture implements Model {
	modelClass: Model[];
	weights: number[];
	savedWeights: number[];
	N: number;
	constructor(modelClass, weights) {
		this.modelClass = [...modelClass];
		this.weights = [...weights];

		this.savedWeights = [];
		this.N = modelClass.length;

		Util.assert(Math.abs(Util.sum(weights) - 1) < 1e-4, 'Prior is not normalised!');
	}

	conditionalDistribution(e: Percept) {
		let s = 0;
		for (let i = 0, N = this.N; i < N; i++) {
			if (this.weights[i] == 0) {
				continue;
			}

			s += this.weights[i] * this.modelClass[i].conditionalDistribution(e);
		}

		Util.assert(s != 0, `Cromwell violation: xi(${e.obs},${e.rew}) = 0`);
		return s;
	}

	update(a: Action, e: Percept) {
		this.perform(a);
		this.bayesUpdate(a, e);
	}

	bayesUpdate(a: Action, e: Percept) {
		var xi = 0;
		for (var i = 0, N = this.N; i < N; i++) {
			if (this.weights[i] == 0) {
				continue;
			}

			this.weights[i] = this.weights[i] * this.modelClass[i].conditionalDistribution(e);
			xi += this.weights[i];
		}

		Util.assert(xi != 0, `Cromwell violation: xi(${e.obs},${e.rew}) = 0`);

		for (var i = 0, N = this.N; i < N; i++) {
			this.weights[i] /= xi;
		}
	}

	perform(a: Action) {
		for (let i = 0, N = this.N; i < N; i++) {
			if (this.weights[i] == 0) {
				continue;
			}

			this.modelClass[i].perform(a);
		}
	}

	generatePercept(): Percept {
		let nu = Util.sample(this.weights);
		return this.modelClass[nu].generatePercept();
	}

	entropy(): number {
		return Util.entropy(this.weights)
	}

	save(): void {
		this.savedWeights = [...this.weights];
		for (let i = 0, N = this.N; i < N; i++) {
			this.modelClass[i].save();
		}
	}

	load(): void {
		this.weights = [...this.savedWeights];
		for (let i = 0, N = this.N; i < N; i++) {
			this.modelClass[i].load();
		}
	}

	infoGain(): number {
		return Util.entropy(this.savedWeights) - Util.entropy(this.weights)
	}
}

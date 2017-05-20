import { Util } from './util';
import { Index, Vector } from './x';

export interface Distribution {
	sample(): any;
	prob(x: any): number;
}

export class Uniform {
	a: number;
	b: number;
	constructor(a: number, b: number) {
		Util.assert(b > a);
		this.a = a;
		this.b = b;
	}

	sample() {
		return Math.random() * (this.b - this.a) + this.a;
	}

	prob(x: number) {
		if (x >= this.a && x <= this.b) {
			return 1 / (this.b - this.a);
		} else {
			// outside support
			return 0;
		}
	}
}

export class Bernoulli {
	p: number;
	constructor(p: number) {
		Util.assert(p <= 1 && p >= 0);
		this.p = p;
	}

	sample(): boolean {
		return Math.random() < this.p;
	}

	prob(x: number) {
		if (x == 1) {
			return this.p;
		} else if (x == 0) {
			return 1 - this.p;
		} else {
			// outside support
			return 0;
		}
	}
}

export class Normal {
	mu: number;
	sigma: number;
	constructor(mu: number, sigma: number) {
		this.mu = mu;
		this.sigma = sigma;
	}

	sample(): number {
		let theta = 2 * Math.PI * Math.random();
		let r = this.sigma * Math.sqrt(-2 * Math.log(1 - Math.random()));
		return this.mu + r * Math.cos(theta);
	}

	prob(x: number): number {
		return 1 / (Math.sqrt(2 * this.sigma ** 2 * Math.PI)) *
			Math.E ** (-1 * (x - this.mu) ** 2 / (2 * this.sigma ** 2));
	}

	data() {
		let xmin = this.mu - 4 * this.sigma;
		let xmax = this.mu + 4 * this.sigma;
		let dx = (xmax - xmin) / 10000;
		let dat = [];
		for (let x = xmin; x < xmax; x += dx) {
			dat.push({ x: x, y: this.prob(x) });
		}

		return dat;
	}
}

export class Beta {
	alpha: number;
	beta: number;
	constructor(alpha: number, beta: number) {
		this.alpha = alpha;
		this.beta = beta;
	}

	prob(p: number) {
		Util.assert(p <= 1 && p >= 0);
		let f = math.factorial;
		let beta = <number>f(this.alpha) *
			<number>f(this.beta) / <number>f(this.alpha + this.beta);
		return <number>math.pow(p, this.alpha - 1) *
			<number>math.pow(1 - p, this.beta - 1) / beta;
	}

	sample(): number {
		// just return the mean for now
		return this.mean();
	}

	mean(): number {
		return this.alpha / (this.alpha + this.beta);
	}

	update(bit: boolean) {
		bit ? this.alpha++ : this.beta++;
	}
}

export class Dirichlet {
	alphas: Float32Array;
	K: Index;
	alphaSum: number;
	constructor(alphas: Float32Array) {
		this.alphas = alphas;
		this.K = alphas.length;
		this.alphaSum = Util.sum(alphas);
	}

	prob(pvec: Vector) {
		Util.assert(pvec.length == this.K);
		Util.assert(Util.sum(pvec) == 1);
		let beta = 1;
		for (let i = 0; i < this.K; i++) {
			beta *= <number>math.factorial(this.alphas[i]);
		}
		beta /= <number>math.factorial(Util.sum(this.alphas));
		let out = beta;
		for (let i = 0; i < this.K; i++) {
			out *= <number>math.pow(pvec[i], this.alphas[i] - 1);
		}

		return out;
	}

	sample(idx: Index) {
		// just return the mean for now
		return this.mean(idx);
	}

	mean(idx: Index) {
		if (!this.alphaSum) {
			return 1 / this.K; // admit Haldane prior
		}

		return this.alphas[idx] / this.alphaSum;
	}

	means() {
		let means = [];
		for (let i = 0; i < this.K; i++) {
			means.push(this.mean(i));
		}

		return means;
	}

	update(k: Index) { // for performance, only one obs at a time now
		this.alphas[k]++;
		this.alphaSum++;
	}
}

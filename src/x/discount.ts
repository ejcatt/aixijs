import { Util } from './util';

export type Discount = (dfr: number, t?: number) => number;

export class MatrixDiscount {
	constructor(params: any) {
		let discounts = Util.arrayCopy(params.discounts);
		let times = Util.arrayCopy(params.discountChanges);
		let idx = 0;
		let current = discounts[idx];
		idx++;

		return (dfr: number, t = 0): number => {
			if (t == times[idx]) {
				current = discounts[idx];
				idx++;
			}

			return current(dfr);
		};
	}
}

export class GeometricDiscount {
	constructor(params: any) {
		let gamma = params.gamma;
		return (dfr: number): number => Math.pow(gamma, dfr);
	}
}

export class HyperbolicDiscount {
	constructor(params: any) {
		let beta = params.beta;
		let kappa = params.kappa;
		return (dfr: number): number => Math.pow(1 + kappa * dfr, -beta);
	}
}

export class PowerDiscount {
	constructor(params: any) {
		let beta = params.beta;
		return (dfr: number, t = 0): number => Math.pow(dfr + t, -beta);
	}
}

export class ConstantHorizonDiscount {
	constructor(params: any) {
		let horizon = params.horizon;
		return (dfr: number): number => dfr < horizon ? 1 : 0;
	}
}

export class CustomDiscount {
	constructor(params: any) {
		let vector = Util.arrayCopy(params.vector);
		return (dfr: number): number => vector[dfr];
	}
}

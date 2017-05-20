import { Vector, Time, BitVector, Action, Index } from './x';
import * as jQuery from 'jquery';

export namespace Util {
	export function zeros(n: number): Float32Array {
		return new Float32Array(n);
	}

	export function randomChoice(arr: Vector): number {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	export function assert(condition: any, message?: string) {
		if (!condition) {
			message = message || 'Assertion failed';
			throw new Error(message);
		}
	}

	export function sum(arr: Vector | Float32Array): number {
		var s = 0;
		var n = arr.length;
		for (var i = 0; i < n; i++) {
			s += arr[i];
		}

		return s;
	}

	export function prod(arr: Vector | Float32Array): number {
		let p = 0;
		let n = arr.length;
		for (let i = 0; i < n; i++) {
			p *= arr[i];
		}

		return p;
	}

	export function deepCopy(obj: Object): Object {
		return jQuery.extend(true, {}, obj);
	}

	export function arrayCopy(arr: Array<any>): Array<any> {
		return jQuery.extend(true, [], arr);
	}

	export function roundTo(x: number, figs: number) {
		let tmp = Math.pow(10, figs);
		return Math.round(x * tmp) / tmp;
	}

	export function sample(weights: Vector): Index {
		var s = Math.random();
		var p = 0;
		for (var i = 0; i < weights.length; i++) {
			if (s <= p) {
				return i - 1;
			}

			p += weights[i];
		}

		return weights.length - 1;
	}

	export function KLDivergence(p: Vector, q: Vector): number {
		Util.assert(p.length == q.length, 'KL: p & q are different lengths');
		let n = p.length;
		let sp = Util.sum(p);
		let sq = Util.sum(q);
		let s = 0;
		for (let i = 0; i < n; i++) {
			if (p[i] == 0 || q[i] == 0) {
				continue;
			}

			s += (p[i] / sp) * Math.log2(p[i] * sq / (q[i] * sp));
		}

		return s;
	}

	export function entropy(p: Vector) {
		var s = 0;
		var n = p.length;
		for (var i = 0; i < n; i++) {
			if (p[i] == 0) {
				continue;
			}

			s -= p[i] * Math.log2(p[i]);
		}

		return s;
	}

	export function logProgress(t: Time, T: Time) {
		let prog = (t + 1) / T * 100;
		if (prog % 10 == 0) {
			console.clear();
			console.log(`Progress: ${prog}%`);
		}
	}

	export function softMax(v: Vector, j: number) {
		let s = 0;
		v.forEach(x => {
			s += Math.pow(Math.E, x);
		});
		return Math.pow(Math.E, j) / s;
	}

	export function randInts(n: number) {
		let arr = new Array(n);
		for (let i = 0; i < n; i++) {
			arr[i] = i;
		}

		let max = n - 1;
		let r;
		let swap;
		while (max > 0) {
			r = Math.floor(Math.random() * max);
			swap = arr[r];
			arr[r] = arr[max];
			arr[max] = swap;
			max--;
		}

		return arr;
	}

	export function cumToInc(arr: Vector) {
		let T = arr.length;
		let inc = new Array(T);
		inc[0] = 0;
		for (let i = 1; i < T; i++) {
			inc[i] = arr[i] - arr[i - 1];
		}

		return inc;
	}

	export function sigmoid(x: Vector) {
		return 1.0 / (1 + Math.exp(-x));
	}

	export function encode(symlist: BitVector, value: number, bits: number) {
		var tmp = value;
		for (var i = 0; i < bits; i++ , tmp /= 2) {
			symlist.push(!!(tmp & 1));
		}
	}

	export function decode(symlist: BitVector, bits: number): number {
		let value = 0;
		let n = symlist.length;
		for (let i = 0; i < bits; i++) {
			value = Number(symlist[n - i - 1]) + 2 * value;
		}

		return value;
	}

	export function I(a: any, b: any) {
		// indicator fn
		return a == b ? 1 : 0;
	}

	export function gaussRandom(retval?: boolean, val?: number): number {
		if (!val) {
			val = 0;
		}

		if (retval) {
			retval = false;
			return val;
		}

		let u = 2 * Math.random() - 1;
		let v = 2 * Math.random() - 1;
		let r = u * u + v * v;
		if (r == 0 || r > 1) return Util.gaussRandom();
		let c = Math.sqrt(-2 * Math.log(r) / r);
		val = v * c; // cache this
		retval = true;
		return u * c;
	}

	export function randi(a: number, b: number): number {
		return Math.floor(Math.random() * (b - a)) + a;
	}

	export function randf(a: number, b: number): number {
		return Math.random() * (b - a) + a;
	}

	export function randn(mu: number, std: number): number {
		return mu + Util.gaussRandom() * std;
	}

	export function argmax(obj: any,
		accessor: (obj: any, a: Action) => number,
		numActions: Action) {
		let max = Number.NEGATIVE_INFINITY;
		let ties: Array<Action> = [];
		for (let a = 0; a < numActions; a++) {
			let val = accessor(obj, a);
			if (val < max) {
				continue;
			} else if (val > max) {
				ties = [a];
				max = val;
			} else {
				ties.push(a);
			}
		}

		return Util.randomChoice(ties);
	}
}

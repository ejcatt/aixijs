import { Index } from './x';
import { Util } from './util';

export class Queue<T> {
	arr: Array<T>;
	N: Index;
	pos: Index;
	constructor() {
		this.arr = [];
		this.N = 0;
		this.pos = 0;
	}

	isEmpty(): boolean {
		return this.pos == this.N;
	}

	append(item: T): void {
		if (this.N == this.arr.length) {
			this.arr.push(item);
		} else {
			this.arr[this.N - 1] = item;
		}

		this.N++;
	}

	remove(): T {
		Util.assert(!this.isEmpty());
		var val = this.arr[this.pos];
		this.pos++;
		if (this.pos * 2 >= this.N) {
			this.arr = this.arr.slice(this.pos);
			this.N -= this.pos;
			this.pos = 0;
		}
		return val;
	}

	peek(): T {
		return this.arr[this.pos];
	}

	peekBack(): T {
		return this.arr[this.N - 1];
	}

	popBack(): T {
		var val = this.arr[this.N - 1];
		this.N--;
		return val;
	}
}

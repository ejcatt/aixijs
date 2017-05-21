import { Index } from './x';
import { Util } from './util';

export class Stack<T> {
	size: Index;
	private arr: Array<T>;
	private pos: Index;
	constructor() {
		this.arr = [];
		this.size = 0;
		this.pos = 0;
	}

	isEmpty(): boolean {
		return this.pos == 0;
	}

	push(item: T): void {
		if (this.pos >= this.size) {
			this.arr.push(item);
			this.size++;
		} else {
			this.arr[this.pos] = item;
		}
		this.pos++;
	}

	pop(): T {
		Util.assert(!this.isEmpty());
		let val = this.arr[this.pos];
		this.pos--;
		return val;
	}
}
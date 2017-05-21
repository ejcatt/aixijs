import { Stack } from './../../x/stack';
import { Dirichlet } from './../../x/distribution';
import {
	Gridworld,
	ACTIONS,
	REWARDS,
	Tile,
	Dispenser,
	Wall,
	Trap
} from './../../environments/gridworld';
import { Action, Percept, Vector, BitVector, Tuple, Index } from '../../x/x';
import { Queue } from '../../x/queue';
import { Util } from '../../x/util';

export class DirichletGrid {
	percept: any;
	weightQueue: Queue<number>;
	paramQueue: Queue<Tuple>;
	actions: any[];
	numActions: Action;
	N: number;
	T: number = 4; // grid topology
	grid: DirichletTile[][];
	params: any[];
	weights: Vector;

	private savedParams: any[];
	private savedWeights: Vector;
	private savedState: { x: number, y: number };

	private wall: any;
	private state: DirichletTile;

	constructor(N: number) {
		this.actions = ACTIONS;
		this.numActions = this.actions.length;
		this.N = N;
		this.T = 4;

		this.grid = [];
		this.params = [];
		this.weightQueue = new Queue<number>();
		this.paramQueue = new Queue<Tuple>();

		for (let idx = 0; idx < this.N; idx++) {
			let gridrow = [];
			let prow = [];
			for (let jdx = 0; jdx < this.N; jdx++) {
				gridrow.push(new DirichletTile(idx, jdx));
				prow.push(gridrow[jdx].distribution.alphas);
			}

			this.grid.push(gridrow);
			this.params.push(prow);
		}

		this.savedParams = [];
		for (let i = 0; i < this.N; i++) {
			this.savedParams[i] = Util.arrayCopy(this.params[i]);
		}

		this.weights = Util.zeros(this.N * this.N);
		for (let i = 0; i < this.N * this.N; i++) {
			this.weights[i] = this.grid[0][0].prob(1); // Haldane prior
		}

		this.savedWeights = [...this.weights];

		this.wall = new Wall(0, 0);
		this.wall.prob = (k: number) => Util.I(k, 2);
		this.wall.update = () => null;
		this.wall.sample = () => this.wall;

		this.state = this.grid[0][0];

		for (let i = 0; i < this.N; i++) {
			for (let j = 0; j < this.N; j++) {
				let t = this.grid[i][j];
				let ne: DirichletTile[] = [];
				for (let dir of this.actions) {
					if (dir[0] == 0 && dir[1] == 0) {
						continue; // don't return self
					}

					let newx = t.x + dir[0];
					let newy = t.y + dir[1];
					if (newx < 0 || newy < 0 || newx >= this.N || newy >= this.N) {
						ne.push(this.wall);
						continue;
					}

					ne.push(this.grid[newx][newy]);
				}

				t.neighbors = ne;
			}
		}

		this.perform(4);
		this.state.update(0); // Laplace
		this.state.update(1); // Laplace
	}

	generatePercept(): Percept {
		return this.percept;
	}

	conditionalDistribution(e: Percept) {
		var o = e.obs;
		var r = e.rew;
		var oBits: BitVector = [];
		Util.encode(oBits, o, this.numActions - 1);
		oBits.reverse();

		var s = this.state;

		var p = 1;
		var ne = s.neighbors;
		for (var i = 0; i < this.numActions - 1; i++) {
			if (oBits[i]) {
				p *= ne[i].prob(2); // wall
			} else {
				p *= (1 - ne[i].prob(2));
			}
		}

		var rew = r - REWARDS.move;
		if (rew == REWARDS.chocolate) {
			p *= s.prob(1);
		} else if (rew == REWARDS.empty) {
			p *= s.prob(0);
		}

		return p;
	}

	perform(a: Action) {
		let s = this.state;

		let samples = [];
		for (let i = 0; i < s.neighbors.length; i++) {
			samples.push(s.neighbors[i].sample());
		}

		let t = samples[a];

		let str = '';
		for (let sam of samples) {
			str += sam.symbol;
		}

		let wallHit = false;

		// if agent moved, we have to re-sample
		if (a != 4 && !t.symbol) {
			str = '';
			let ne2 = this.grid[t.x][t.y].neighbors;
			for (let n of ne2) {
				if (n == s) {
					str += 0;
					continue;
				}

				let sam = n.sample();
				str += sam.symbol;
			}

			s = t.parent;
		} else if (a != 4 && t.symbol) {
			wallHit = true;
		}

		this.state = s;

		let pEmpty = s.prob(0);
		let pDisp = s.prob(1);
		let norm = pEmpty + pDisp;
		let disp = Util.sample([pEmpty / norm, pDisp / norm]);

		let o = parseInt(str, 2);
		let r = REWARDS.empty;
		if (wallHit) {
			r = REWARDS.wall;
		} else if (disp) {
			r = REWARDS.chocolate;
		}

		r += REWARDS.move;

		this.percept = { obs: o, rew: r };
	}

	bayesUpdate(a: Action, e: Percept) {
		var o = e.obs;
		var r = e.rew;
		var oBits: BitVector = [];
		Util.encode(oBits, o, this.numActions - 1);
		oBits.reverse();

		var s = this.state;
		var ne = s.neighbors;
		for (var i = 0; i < this.numActions - 1; i++) {
			var n = ne[i];
			if (n.constructor == Wall) {
				continue;
			}

			if (oBits[i]) {
				n.update(2); // wall
			} else {
				if (n.distribution.alphas[0] == 0 && n.distribution.alphas[1] == 0) {
					n.update(0);
					n.update(1);
				}
			}

			this.weights[n.y * this.N + n.x] = n.prob(1);
			this.weightQueue.append(n.y * this.N + n.x);
			this.params[n.x][n.y] = n.distribution.alphas;
			this.paramQueue.append([n.x, n.y]);

		}

		var rew = r - REWARDS.move;

		if (rew == REWARDS.empty) {
			s.update(0);
		} else if (rew == REWARDS.chocolate) {
			s.update(1);
		}

		this.params[s.x][s.y] = s.distribution.alphas;
		this.paramQueue.append([s.x, s.y]);
		this.weights[s.y * this.N + s.x] = s.prob(1);
		this.weightQueue.append(s.y * this.N + s.x);
	}

	update(a: Action, e: Percept) {
		this.perform(a);
		this.bayesUpdate(a, e);
	}

	infoGain(): number {
		var stack = new Stack<Index>();
		var s = this.state;
		var ne = s.neighbors;
		var ig = 0;
		for (var i = 0; i < this.T; i++) {
			if (ne[i].constructor == Wall) {
				continue;
			}
			let idx = this.weightQueue.popBack();
			stack.push(idx);
			var p_ = this.weights[idx];
			var p = this.savedWeights[idx];
			if (p != 0 && p_ != 0) {
				ig += p_ * Math.log(p_) - p * Math.log(p);
			}
		}
		while (stack.size > 0) {
			let idx = stack.pop();
			this.weightQueue.append(idx);
		}

		return ig;
	}

	entropy(): number {
		return Util.entropy(this.weights);
	}

	save() {
		for (var i = 0; i < this.N; i++) {
			for (var j = 0; j < this.N; j++) {
				for (var k = 0; k < this.T; k++) {
					this.savedParams[i][j][k] = this.params[i][j][k];
				}
			}
		}

		this.savedState = { x: this.state.x, y: this.state.y };
		this.savedWeights = [...this.weights];
	}

	load() {
		this.state = this.grid[this.savedState.x][this.savedState.y];
		while (!this.paramQueue.isEmpty()) {
			var [i, j] = this.paramQueue.remove();
			for (var k = 0; k < this.T; k++) {
				this.params[i][j][k] = this.savedParams[i][j][k];
			}
			var t = this.grid[i][j];
			t.distribution.alphas = this.params[i][j];
			t.distribution.alphaSum = Util.sum(t.distribution.alphas);
		}

		while (!this.weightQueue.isEmpty()) {
			var idx = this.weightQueue.remove();
			this.weights[idx] = this.savedWeights[idx];
		}
	}

	copy() {
		return this; // TODO; fix
	}
}

class DirichletTile {
	x: number;
	y: number;
	distribution: Dirichlet;
	children: Tile[];
	neighbors: DirichletTile[];
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.children = [];
		this.children.push(new Tile(x, y));
		this.children.push(new Dispenser(x, y, 1));
		this.children.push(new Wall(x, y));
		this.children.push(new Trap(x, y));

		this.distribution = new Dirichlet([0, 0, 0, 0]);

		for (let child of this.children) {
			child.parent = this;
		}
	}

	sample(): Tile {
		let p = this.distribution.means();
		let idx = Util.sample(p);

		return this.children[idx];
	}

	update(k: number) {
		this.distribution.update(k);
	}

	prob(k: number): number {
		return this.distribution.mean(k);
	}
}

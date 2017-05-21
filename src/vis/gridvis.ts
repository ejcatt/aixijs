import { Environment } from './../environments/environment';
import { Trace, DirichletTrace, ThompsonTrace } from './../x/trace';
import { UI } from './../ui';
import {
	Gridworld,
	Tile,
	Dispenser,
	SelfModificationTile,
	Wall,
	Trap,
	NoiseTile
} from './../environments/gridworld';
import { Visualization } from './visualization';
import * as d3 from 'd3';
import { Vector, Time } from '../x/x';
import { Util } from '../x/util';

const MAXTILEPX = 40;

const COLORS = {
	Tile: '#fdfdfd',
	Wall: 'grey',
	Dispenser: 'orange',
	Trap: 'pink',
	SelfModificationTile: 'blue',
	ThompsonVis: 'red'
};

export class GridVisualization extends Visualization {
	grid: Tile[][];
	N: number;
	rectangles: any[];

	d: number;
	width: number;
	height: number;

	static tileSizePx: number = 40;
	constructor(env: Gridworld, trace: Trace, ui: UI) {
		super(trace, ui);
		this.grid = env.grid;
		this.N = env.N;
		this.rectangles = [];
		for (let i = 0; i < env.N; i++) {
			this.rectangles.push(new Array(env.N));
		}

		var viewWidth = Math.max(document.documentElement.clientWidth,
			window.innerWidth || 0);
		var viewHeight = Math.max(document.documentElement.clientHeight,
			window.innerHeight || 0);

		var dim = 0.5 * Math.min(viewWidth, viewHeight);
		var d = dim / this.N;
		if (!d) {
			d = MAXTILEPX;
		}
		this.d = Math.min(d, MAXTILEPX);
		this.width = (this.d + 1) * this.N - 1;
		this.height = (this.d + 1) * this.N - 1;
		this.svg
			.attr('width', this.width)
			.attr('height', this.height);

		this.grid.forEach((row, idx) => {
			row.forEach((tile, jdx) => {
				let r = GridVisualization.makeTile(this.svg, tile, undefined, this);
				this.rectangles[idx][jdx] = r;
			});
		});

		this.svg.append('image')
			.attr('xlink:href', 'assets/robot.svg')
			.attr('x', 0)
			.attr('y', 0)
			.attr('height', this.d)
			.attr('id', 'agent');
	}

	protected updateEnv() {
		let x = this.trace.states[this.t].x;
		let y = this.trace.states[this.t].y;
		d3.select('#agent')
			.attr('x', (x + 0.2) * this.d)
			.attr('y', y * this.d);
	}

	static makeTile(svg: d3.Selection<any, {}, HTMLElement, any>,
		t: Tile,
		color?: string,
		gv?: GridVisualization) {
		let d = MAXTILEPX;
		if (gv) {
			d = gv.d;
		}
		let r = svg.append('rect')
			.attr('x', t.x * d)
			.attr('y', t.y * d)
			.attr('height', d)
			.attr('width', d)
			.attr('stroke', 'black')
			.attr('stroke-width', 2);

		color = getColor(t);
		if (color == COLORS.Dispenser) {
			GridVisualization.addCircle(svg,
				t.x,
				t.y,
				COLORS.Dispenser,
				'',
				(<Dispenser>t).theta,
				gv);
		}
		r.attr('fill', color);

		return r;
	}

	static makeLegend(div: HTMLDivElement,
		T: new (x: number, y: number) => Tile,
		color: string) {
		let svg = d3.select(`#${div}`).append('svg')
			.attr('id', `${div}_svg`)
			.attr('width', MAXTILEPX)
			.attr('height', MAXTILEPX);
		GridVisualization.makeTile(svg, new T(0, 0), color);
	}

	static addCircle(svg: d3.Selection<any, {}, HTMLElement, any>,
		x: number,
		y: number,
		color: string,
		id: string,
		size: number,
		gv?: GridVisualization) {
		var d = MAXTILEPX;
		if (gv) {
			d = gv.d;
		}
		svg.append('circle')
			.attr('cx', x * d + d / 2)
			.attr('cy', y * d + d / 2)
			.attr('r', size ? (d / 2) * size : d / 8)
			.attr('fill', color)
			.attr('stroke', '#000')
			.attr('id', id);
	}
}

function getColor(t: Tile): string { // TODO: fix this eww :(
	let color: string;
	let type = t.constructor;
	switch (type) {
		case Tile:
			color = COLORS.Tile;
			break;
		case Wall:
			color = COLORS.Wall;
			break;
		case Dispenser:
			color = COLORS.Tile;
			break;
		case SelfModificationTile:
			color = COLORS.SelfModificationTile;
			break;
		case Trap:
			color = COLORS.Trap;
			break;
		default:
			throw 'Unknown tile type';
	}
	return color;
}

export class BayesGridVis extends GridVisualization {
	static exps = ['aixi', 'dispenser', 'mixture'];
	updateAgent() {
		this.grid.forEach(row => {
			row.forEach(tile => {
				let rectangle = this.rectangles[tile.x][tile.y];
				let c = this.posteriorColor(tile, this.t);
				let col = null;
				if (c) {
					let r = Math.floor(c.r);
					let g = Math.floor(c.g);
					let b = Math.floor(c.b);
					col = `rgb(${r},${g},${b})`;
				} else {
					col = getColor(tile);
				}

				rectangle.attr('fill', col);
			});
		});
	}

	posteriorColor(tile: Tile, t: Time) {
		let tc = tile.constructor;
		if (tc == Wall ||
			tc == SelfModificationTile) {
			return null;
		}

		if (tc == NoiseTile) {
			return {
				r: 255 * Math.random(),
				g: 255 * Math.random(),
				b: 255 * Math.random(),
			};
		}

		let trap = tile.constructor == Trap;

		// TODO visualize direct from agent mixture model!

		let p = this.trace.models[t][tile.y * this.N + tile.x];
		return {
			g: 255 - 100 * Number(trap),
			r: 255 - p * this.N ** 2 * 100,
			b: 255 - p * this.N ** 2 * 100 - 100 * Number(trap),
		};
	}
}

export class DirichletVis extends BayesGridVis {
	static exps = ['dispenser', 'dirichlet'];
	posteriorColor(tile: Tile, t: Time) {
		let alphas = (<DirichletTrace>this.trace).params[t][tile.x][tile.y];
		let as = Util.sum(alphas);
		if (as == 0) {
			return { r: 255, g: 255, b: 255 };
		}

		return {
			r: 255 * (0.5 - alphas[2] / as),
			g: 255 * (1 - alphas[0] / as),
			b: 255 * (1 - alphas[1] / as),
		};
	}
}

function moveToFront(svg: d3.Selection<any, {}, any, any>) {
	return svg.each(function () {
		this.parentNode.appendChild(this);
	});
}

export class ThompsonVis extends BayesGridVis {
	static exps = ['dispenser', 'mixture', 'thompson'];
	updateAgent() {
		super.updateAgent();
		d3.select('#thompson_disp').remove();
		let rhoPos = (<ThompsonTrace>this.trace).rhos[this.t];
		GridVisualization.addCircle(
			this.svg, rhoPos.x, rhoPos.y, COLORS.ThompsonVis, 'thompson_disp', 1, this);
		moveToFront(d3.select('#agent'));
	}
}

export class MDLVis extends ThompsonVis {
	static exps = ['dispenser', 'mixture', 'mdl'];
}

export class BayesExpVis extends BayesGridVis {
	static exps = ['dispenser', 'mixture', 'bayesexp'];
	// TODO flag to show when agent is in explore mode or not
	// use trace.exploration_phases
}

export class WireHeadVis extends BayesGridVis {
	static exps = ['wirehead', 'mixture', 'dispenser'];
	updateAgent() {
		super.updateAgent();
		if (this.trace.states[this.t].wireheaded) {
			for (let i = 0; i < this.N; i++) {
				for (let j = 0; j < this.N; j++) {
					let r = this.rectangles[i][j];
					let col = r.attr('fill');
					let rgb = col.replace(/[^\d,]/g, '').split(',');
					rgb[0] += 20;
					r.attr('fill', `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
				}
			}
		}
	}
}

export class HookedOnNoiseVis extends BayesGridVis {
	static exps = ['dispenser', 'mixture', 'noise'];
}

// class TabularGridVis extends GridVisualization {
// 	constructor(env, trace, ui) {
// 		super(env, trace, ui);
// 		this.arrows = [];
// 		for (let i = 0; i < env.N; i++) {
// 			this.arrows.push(new Array(env.N));
// 		}

// 		this.q_list = trace.q_map;
// 		this.arrow_actions = [0, 1, 2, 3];

// 		this.svg.append('defs').append('marker')
// 			.attr('id', 'arrowhead')
// 			.attr('refX', 3)
// 			.attr('refY', 2)
// 			.attr('markerWidth', 3)
// 			.attr('markerHeight', 4)
// 			.attr('orient', 'auto')
// 			.append('path')
// 			.attr('d', 'M 0,0 V 4 L2,2	 Z');

// 		this.grid.forEach((row, idx) => {
// 			row.forEach((tile, jdx) => {
// 				tile.info = [0, 0, 0, 0];
// 				if (!tile.legal || tile.goal) {
// 					this.arrows[idx][jdx] = null;
// 					return;
// 				}

// 				let xcoord = tile.x * this.d;
// 				let ycoord = tile.y * this.d;
// 				let arrowList = [];
// 				this.arrow_actions.forEach(a => {
// 					let arrow = this.svg.append('line')
// 						.attr('x1', xcoord)
// 						.attr('y1', ycoord)
// 						.attr('x2', xcoord)
// 						.attr('y2', ycoord)
// 						.attr('stroke', 'black')
// 						.attr('stroke-width', '2')
// 						.attr('marker-end', 'url(#arrowhead)');
// 					arrowList.push(arrow);
// 				});
// 				this.arrows[idx][jdx] = arrowList;
// 			});
// 		});
// 	}

// 	updateAgent() {
// 		this.grid.forEach(row => {
// 			row.forEach(tile => {
// 				if (!tile.legal || tile.goal) {
// 					return;
// 				}

// 				let xcoord = tile.x * this.d;
// 				let ycoord = tile.y * this.d;

// 				let qSum = 0;
// 				this.arrow_actions.forEach(a => {
// 					qSum += Math.pow(Math.E, tile.info[a]);
// 				});

// 				this.arrow_actions.forEach(a => {
// 					let lineSize = this.d / 2 * Math.pow(Math.E, tile.info[a]) / qSum;
// 					let dx = 0;
// 					let dy = 0;
// 					if (a < 2) {
// 						dx = Math.pow(-1, a + 1) * lineSize;
// 					} else {
// 						dy = Math.pow(-1, a) * lineSize;
// 					}

// 					if (lineSize > 3) {
// 						this.arrows[tile.x][tile.y][a]
// 							.attr('x1', xcoord + this.d / 2)
// 							.attr('y1', ycoord + this.d / 2)
// 							.attr('x2', xcoord + this.d / 2 + dx)
// 							.attr('y2', ycoord + this.d / 2 - dy)
// 							.attr('visibility', 'visible');
// 					} else {
// 						this.arrows[tile.x][tile.y][a]
// 							.attr('visibility', 'hidden');
// 					}
// 				});
// 			});
// 		});
// 		this.grid[this.pos_trace[this.time].x][this.pos_trace[this.time].y]
// 			.info[this.a_trace[this.time]] = this.model_trace[this.time];

// 		if (this.time % ((this.t_max + 1) / this.jumps) != 0) {
// 			return;
// 		}

// 		let index = this.time / ((this.t_max + 1) / this.jumps);
// 		if (this.time == 0) {
// 			this.grid.forEach(row => {
// 				row.forEach(tile => {
// 					tile.info = [0, 0, 0, 0];
// 				});
// 			});
// 		} else {
// 			for (let [key, value] of this.q_list[index].map) {
// 				let coord = {
// 					x: key.charAt(0),
// 					y: key.charAt(1),
// 				};
// 				let a = key.charAt(2);
// 				this.grid[coord.x][coord.y].info[a] = value;
// 			}
// 		}
// 	}
// }
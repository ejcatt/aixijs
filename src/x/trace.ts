import { TabularAgent } from './../agents/tabular';
import { Agent } from '../agents/agent';
import { Environment } from '../environments/environment';
import { Model } from '../models/model';
import { Action, Observation, Reward, Percept, Time, Vector } from './x';
import { MDLAgent } from './../agents/mdl';
import { Gridworld } from './../environments/gridworld';
import { ThompsonAgent } from './../agents/thompson';
import { BayesAgent } from './../agents/bayes';
import { BayesExp } from './../agents/bayesexp';
import { Util } from './util';
import { Plot, AverageRewardPlot, IGPlot, PlotConstructor } from '../vis/plot';

export type TraceConstructor = new (t: Time) => Trace;

export class Trace {
	states: any[];
	actions: Action[];
	observations: Observation[];
	rewards: Reward[];
	averageReward: Reward[];
	totalReward: Reward;
	explored: number[];
	models: any[];

	plots: PlotConstructor[] = [AverageRewardPlot];
	iter: number;
	T: Time;

	runtime: Time;
	fps: number;

	constructor(T: Time) {
		this.states = [];
		this.actions = [];
		this.observations = [];
		this.rewards = [];
		this.averageReward = [];
		this.models = [];
		this.totalReward = 0;
		this.explored = [];
		this.T = T;
		this.iter = 0;
	}

	private logState(env: Environment) {
		this.states.push(env.getState());
		this.explored.push(100 * env.visited / env.numStates);
	}

	private logAction(a: Action) {
		this.actions.push(a);
	}

	private logPercept(e: Percept) {
		this.observations.push(e.obs);
		this.totalReward += e.rew;
		this.rewards.push(this.totalReward);
		this.averageReward.push(this.totalReward / (this.iter + 1));
	}

	protected logModel(agent: Agent) {
		return;
	}

	log(agent: Agent, env: Environment, a: Action, e: Percept) {
		this.logModel(agent);
		this.logState(env);
		this.logAction(a);
		this.logPercept(e);
		this.iter++;
	}
}


export class TabularTrace extends Trace {
	constructor(T: Time) {
		super(T);
	}

	protected logModel(agent: TabularAgent) {
		this.models.push(agent.Q.get(agent.lastObs, agent.lastAction));
	}
}

export interface ModelInfo {
	weights: Vector;
	extras?: Array<any>;
}

export class BayesTrace extends Trace {
	infoGain: number[];
	totalInformation: number;
	plans: Action[][];

	constructor(T: Time) {
		super(T);
		this.infoGain = [];
		this.totalInformation = 0;
		this.plots.push(IGPlot);
		this.plans = [];
	}

	protected logModel(agent: BayesAgent) {
		this.totalInformation += agent.informationGain;
		this.infoGain.push(this.totalInformation);
		this.models.push(agent.model.log());
		this.plans.push(agent.plan);
	}
}

export class ThompsonTrace extends BayesTrace {
	rhos: any[] = [];
	protected logModel(agent: ThompsonAgent) {
		super.logModel(agent);
		let kek = <Gridworld>agent.rho;
		let goal = (<Gridworld>(agent.rho)).goals[0];
		this.rhos.push({ x: goal.x, y: goal.y }); // TODO: generalize
	}
}

export class MDLTrace extends BayesTrace {
	mappings: any[];
	sigmas: any[] = [];
	protected logModel(agent: MDLAgent) {
		super.logModel(agent);
		if (this.iter == 0) {
			this.mappings = agent.mappings;
		}
	}
}

export class DirichletTrace extends BayesTrace {
	params: any[] = [];

	protected logModel(agent: BayesAgent) {
		super.logModel(agent);
		let idx = this.iter - 1;
		let tmp = this.models[idx];
		this.params[idx] = tmp.extras;
		this.models[idx] = tmp.weights;
	}
}

export class BayesExpTrace extends BayesTrace {
	explorationPhases: boolean[];
	constructor(t: Time) {
		super(t);
		this.explorationPhases = [];
	}

	protected logModel(agent: BayesExp) {
		super.logModel(agent);
		this.explorationPhases.push(agent.explore);
	}
}

import { Model } from './../models/model';
import {Action, Observation, Reward} from "../util/x";
import { Util } from "./util";
import { Environment } from "../environments/environment";
import { Plot, AverageRewardPlot, IGPlot } from '../vis/plot';

export interface Trace {
	logState(env: Environment): void
}

export class BaseTrace implements Trace {
	states: 		any[];
	actions: 		Action[];
	observations: 	Observation[];
	rewards: 		Reward[];
	averageReward: 	Reward[];
	totalReward: 	Reward;
	explored: 		number[];
	models:			Model[];

	plots: Plot[] = [AverageRewardPlot];
	iter: number;
	T: number;

	constructor(T) {
		this.states = [];
		this.actions = [];
		this.observations = [];
		this.rewards = [];
		this.averageReward = [];
		this.models = [];
		this.totalReward = 0;
		this.T = T;
		this.iter = 0;
		this.explored = [];
	}

	logState(env) {
		this.states.push(env.getState());
		this.explored.push(100 * env.visits / env.numStates);
	}

	logAction(a) {
		this.actions.push(a);
	}

	logPercept(e) {
		this.observations.push(e.obs);
		this.totalReward += e.rew;
		this.rewards.push(this.totalReward);
		this.averageReward.push(this.totalReward / (this.iter + 1));
	}

	logModel(agent) {
		return;
	}

	log(agent, env, a, e) {
		this.logModel(agent);
		this.logState(env);
		this.logAction(a);
		this.logPercept(e);
		this.iter++;
	}
}

/*
export class TabularTrace extends BaseTrace {
	constructor(t) {
		super(t);
		this.q_map = [];
		this.jumps = 50;
	}

	logModel(agent) {
		this.models.push(agent.last_q);
		if (agent.lifetime % (this.T / this.jumps) == 0) {
			this.q_map.push(agent.Q.copy());
		}
	}
}
*/

export class BayesTrace extends BaseTrace {
	infoGain: 			number[];
	totalInformation: 	number;
	plans: 				Action[][];

	constructor(T) {
		super(T);
		this.infoGain = [];
		this.totalInformation = 0;
		this.plots.push(IGPlot);
		this.plans = [];
	}

	logModel(agent) {
		this.totalInformation += agent.informationGain;
		this.infoGain.push(this.totalInformation);
		this.models.push(Util.arrayCopy(agent.model.weights));
		this.plans.push(agent.plan);
	}
}

export class ThompsonTrace extends BayesTrace {
	rhos: any[];
	constructor(t) {
		super(t);
		this.rhos = [];
	}

	logModel(agent) {
		super.logModel(agent);
		let goal = agent.rho.goals[0];
		this.rhos.push({ x: goal.x, y: goal.y }); // TODO: generalize
	}
}

class MDLTrace extends ThompsonTrace {
	mappings: any[];
	logModel(agent) {
		super.logModel(agent);
		if (this.iter == 0) {
			this.mappings = agent.mappings;
		}
	}
}

class DirichletTrace extends BayesTrace {
	params: any[][];
	constructor(t) {
		super(t);
		this.params = [];
	}

	logModel(agent) {
		super.logModel(agent);
		let param = [];
		for (let i = 0; i < agent.model.N; i++) {
			param.push(Util.arrayCopy(agent.model.params[i]));
		}

		this.params.push(param);
	}
}

class BayesExpTrace extends BayesTrace {
	explorationPhases: boolean[];
	constructor(t) {
		super(t);
		this.explorationPhases = [];
	}

	logModel(agent) {
		super.logModel(agent);
		this.explorationPhases.push(agent.explore);
	}
}

import { Agent } from '../agents/agent';
import { Environment } from '../environments/environment';
import { Model } from '../models/model';
import { Action, Observation, Reward, Percept, Time } from './x';
import { MDLAgent } from './../agents/mdl';
import { Gridworld } from './../environments/gridworld';
import { ThompsonAgent } from './../agents/thompson';
import { BayesAgent } from './../agents/bayes';
import { BayesExp } from './../agents/bayesexp';
import { Util } from './util';
import { Plot, AverageRewardPlot, IGPlot } from '../vis/plot';

export class Trace {
	states: any[];
	actions: Action[];
	observations: Observation[];
	rewards: Reward[];
	averageReward: Reward[];
	totalReward: Reward;
	explored: number[];
	models: any[];

	plots: (new (t: Trace) => Plot)[] = [AverageRewardPlot];
	iter: number;
	T: Time;

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

/*
export class TabularTrace extends Trace {
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
	params: any[][];
	constructor(T: Time) {
		super(T);
		this.params = [];
	}

	protected logModel(agent: BayesAgent) {
		super.logModel(agent);
		let param = [];
		for (let i = 0; i < agent.model.N; i++) {
			param.push(Util.arrayCopy(agent.model.params[i]));
		}

		this.params.push(param);
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

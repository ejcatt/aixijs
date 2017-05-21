export type Action = number;
export type Observation = number;
export type Reward = number;
export type Time = number;
export type Index = number;
export type Probability = number;

export interface Percept {
	obs: Observation;
	rew: Reward;
}

export type Vector = Array<number> | Float32Array | Float64Array;
export type BitVector = Array<boolean>;


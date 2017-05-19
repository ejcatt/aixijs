export type Action = number;
export type Observation = number;
export type Reward = number;
export interface Percept {
    obs: Observation;
    rew: Reward;
}
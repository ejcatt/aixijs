import {Action, Percept} from "../util/x"

export interface Model {
    update(a: Action, e: Percept): void;
    bayesUpdate(a: Action, e: Percept): void; // TODO: rename?
    perform(a: Action): void;
    generatePercept(): Percept;
    conditionalDistribution(e: Percept): number;
    save(): void;
    load(): void;
    infoGain(): number;
    entropy(): number;
}
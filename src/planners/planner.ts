import {Action} from "../util/x"
import {Model} from "../models/model"

export interface Planner {
    model: Model;
    bestAction(): Action;
}
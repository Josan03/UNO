import { createUnoGameFromMemento, UnoMemento } from "../../domain/src/model/uno";
import { Randomizer } from "../../domain/src/utils/random_utils";
import { ActiveGame } from "./servermodel";
import { standardShuffler } from "../../domain/src/utils/random_utils";

export type ActiveMemento = UnoMemento & { id: string, pending: false }

export function from_memento(m: ActiveMemento, randomizer: Randomizer): ActiveGame {
  return {
    id: m.id,
    pending: false,
    ...createUnoGameFromMemento(m, { randomizer: randomizer, shuffler: standardShuffler })
  }
}

export function to_memento(y: ActiveGame): ActiveMemento {
  return {
    id: y.id,
    pending: y.pending,
    ...y
  }
}

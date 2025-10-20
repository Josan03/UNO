import { createUnoGameFromMemento, UnoMemento } from "../../domain/src/model/uno";
import { Randomizer } from "../../domain/src/utils/random_utils";
import { ActiveGame } from "./servermodel";
import { standardShuffler } from "../../domain/src/utils/random_utils";
import { createRoundClassFromMemento } from "../../domain/src/model/round";

export type ActiveMemento = UnoMemento & { id: string, pending: false }

export function from_memento(m: ActiveMemento, randomizer: Randomizer): ActiveGame {
  const game: ActiveGame = {
    id: m.id,
    pending: false,
    ...createUnoGameFromMemento(m, { randomizer: randomizer, shuffler: standardShuffler })
  }

  if (m.currentRound) {
    game.currentRound = createRoundClassFromMemento(m.currentRound, standardShuffler)
  }

  return game
}

export function to_memento(y: ActiveGame): ActiveMemento {
  return {
    id: y.id,
    pending: y.pending,
    ...y
  }
}

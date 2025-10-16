import { GameMemento } from "../../domain/src/model/uno"
import { Randomizer } from "../../domain/src/utils/random_utils"
import { IndexedGame } from "./servermodel"
import * as UnoGame from "../../domain/src/model/uno"

export type IndexedMemento = GameMemento & { readonly id: string, readonly pending: false }

export function from_memento(m: IndexedMemento, randomizer: Randomizer): IndexedGame {
    return {
        ...UnoGame.createUnoGameFromMemento(m, { randomizer: randomizer }),
        id: m.id,
        pending: false
    }
}

export function to_memento(y: IndexedGame): IndexedMemento {
    return {
        ...y.toMemento(),
        id: y.id,
        pending: y.pending
    }
}
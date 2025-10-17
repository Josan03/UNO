import { GameMemento } from "../../domain/src/model/uno"
import { Randomizer } from "../../domain/src/utils/random_utils"
import { IndexedGame } from "./servermodel"
import * as UnoGame from "../../domain/src/model/uno"

export type IndexedMemento = GameMemento & { readonly id: string, readonly pending: false }

export function from_memento(m: IndexedMemento, randomizer: Randomizer): IndexedGame {
    const game = UnoGame.createUnoGameFromMemento(m, { randomizer })

    return {
        id: m.id,
        pending: false,
        ...game,
    }
}

export function to_memento(y: IndexedGame): IndexedMemento {
    const gameMemento = y.toMemento()

    return {
        id: y.id,
        pending: y.pending,
        ...gameMemento,
    }
}
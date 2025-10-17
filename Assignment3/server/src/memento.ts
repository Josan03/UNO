import { GameMemento } from "../../domain/src/model/uno"
import { Randomizer } from "../../domain/src/utils/random_utils"
import { IndexedGame } from "./servermodel"
import * as UnoGame from "../../domain/src/model/uno"

export type IndexedMemento = GameMemento & { readonly id: string, readonly pending: false }

export function from_memento(m: IndexedMemento, randomizer: Randomizer): IndexedGame {
    const game = UnoGame.createUnoGameFromMemento(m, { randomizer })

    return {
        ...game,
        id: m.id,
        pending: false,
    }
}

export function to_memento(y: IndexedGame): IndexedMemento {
    const gameMemento = y.toMemento()

    return {
        ...gameMemento,
        id: y.id,
        pending: y.pending,
    }
}
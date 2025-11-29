import { Randomizer, standardRandomizer, standardShuffler } from "../utils/random_utils"
import { dice_roller, DiceRoller, DieValue } from "./dice"
import { finished_lower, finished_upper, isLowerSection, lower_section, LowerSection, LowerSectionKey, register_lower, register_upper, SlotKey, total_lower, total_upper, upper_section, UpperSection } from "./yahtzee.score"
import * as _ from 'lodash/fp'

export type YahtzeeSpecs = {
  creator?: string,
  players: string[],
  number_of_players?: number,
}

export type YahtzeeOptions = YahtzeeSpecs & {
  randomizer?: Randomizer
}

export type PlayerScore = {
  upper_section: UpperSection
  lower_section: LowerSection
}

export type Yahtzee = Readonly<{
  players: string[],
  scores: PlayerScore[],
  playerInTurn: number,
  roll: DieValue[],
  rolls_left: number,
  roller: DiceRoller
}>

function score() {
  return {
    upper_section: upper_section(),
    lower_section: lower_section()
  }
}

export function new_yahtzee({players, number_of_players, randomizer = standardRandomizer}: Readonly<YahtzeeOptions>): Yahtzee {
  if (number_of_players && players.length !== number_of_players)
    throw new Error('Wrong number of players: ' + players.length)
  const roller = dice_roller(randomizer)
  return {
    players: standardShuffler(randomizer, players),
    scores: _.times(score, players.length),
    playerInTurn: 0,
    roll: roller.roll(5),
    rolls_left: 2,
    roller
  }
}

export function reroll(held: number[], yahtzee: Yahtzee): Yahtzee {
  if (yahtzee.rolls_left === 0) throw new Error('No more rolls')
  return _.flow([
    _.set('roll', yahtzee.roller.reroll(yahtzee.roll, held)),
    _.update('rolls_left', _.add(-1))
  ])(yahtzee)
}

export function register(slot: SlotKey, yahtzee: Yahtzee): Yahtzee {
  const { playerInTurn, roll } = yahtzee
  if (slot_score(yahtzee.scores[playerInTurn], slot) !== undefined) {
    throw new Error("Cannot overwrite score")
  }
  if (isLowerSection(slot)) {
    return _.flow([
      _.update(['scores', playerInTurn, 'lower_section'], _.partial(register_lower, [slot , roll])),
      _.set('playerInTurn', (playerInTurn + 1) % yahtzee.players.length),
      _.set('roll', yahtzee.roller.roll(5)),
      _.set('rolls_left', 2)
    ])(yahtzee)
  } else {
    return _.flow([
      _.update(['scores', playerInTurn, 'upper_section'], _.partial(register_upper, [slot, roll])),
      _.set('playerInTurn', (playerInTurn + 1) % yahtzee.players.length),
      _.set('roll', yahtzee.roller.roll(5)),
      _.set('rolls_left', 2)
    ])(yahtzee)
  }
}

function total(playerScore: PlayerScore): number {
  return total_upper(playerScore.upper_section) + total_lower(playerScore.lower_section)
}

export function scores(yahtzee: Omit<Yahtzee, 'roller'>): number[] {
  return yahtzee.scores.map(total)
}

function is_full(playerScore: PlayerScore): boolean {
  return finished_upper(playerScore.upper_section) && finished_lower(playerScore.lower_section)
}

export function is_finished(yahtzee: Omit<Yahtzee, 'roller'>): boolean {
  return yahtzee.scores.every(is_full)
}

export function slot_score(playerScore: PlayerScore, key: SlotKey): number | undefined {
  if (isLowerSection(key))
    return playerScore.lower_section.scores[key]
  else
    return playerScore.upper_section.scores[key]
}

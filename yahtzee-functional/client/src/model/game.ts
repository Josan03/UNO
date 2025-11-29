import { isDieValue, type DieValue } from "domain/src/model/dice"
import { type PlayerScore, type Yahtzee, type YahtzeeSpecs } from "domain/src/model/yahtzee.game"
import { isLowerSection, type LowerSection, type LowerSectionScores, type UpperSection, type UpperSectionScores } from "domain/src/model/yahtzee.score"
import * as _ from 'lodash/fp'

type Indexed<Y, pending extends boolean> = Readonly<Y & {id: string, pending: pending}>

export type IndexedYahtzee = Indexed<Omit<Yahtzee, 'roller'>, false>

export type IndexedYahtzeeSpecs = Indexed<YahtzeeSpecs, true>

export type GraphQlGame = Readonly<{ 
  id: string,
  pending: false, 
  players: string[], 
  playerInTurn: number, 
  roll: DieValue[], 
  rolls_left: number, 
  scores: {slot: string, score: number | null}[][]
}>

function findBonus(player_scores: { slot: string; score: number | null }[]) {
  const GraphQLbonus = player_scores.find(s => s.slot === 'bonus')?.score
  return GraphQLbonus === 50 ? 50 : GraphQLbonus === 0 ? 0 : undefined
}

function upper_section_scores(player_scores: { slot: string; score: number | null }[]) {
  const scores = _.flow([_.map(_.update('slot', parseInt)),
    _.filter(_.flow([_.prop('slot'), isDieValue])),
    _.filter((s: {slot: string, score?: number}) => typeof s.score === 'number'),
    _.map(_.juxt([_.prop('slot'), _.prop('score')]))
  ])(player_scores)
  return Object.fromEntries(scores) as UpperSectionScores
}    

function lower_section_scores(player_scores: { slot: string; score: number | null }[]) {
  const scores = player_scores
    .filter(s => isLowerSection(s.slot))
    .filter(s => typeof s.score === 'number')
    .map(s => [s.slot, s.score])
  return Object.fromEntries(scores) as LowerSectionScores
}    

function from_graphql_player_scores(player_scores: { slot: string, score: number | null }[]): PlayerScore {
  const bonus = findBonus(player_scores)
  const upper_section: UpperSection = { scores: upper_section_scores(player_scores), bonus }
  const lower_section: LowerSection = { scores: lower_section_scores(player_scores) }  
  return {upper_section, lower_section}
}      

export function from_graphql_game({ id, players, playerInTurn, roll, rolls_left, scores }: GraphQlGame): IndexedYahtzee {
  return {
    id, pending: false, players, playerInTurn, roll, rolls_left, scores: scores.map(from_graphql_player_scores)
  }
}

import { die_values, DieValue } from './dice'
import { chance_slot, full_house_slot, large_straight_slot, number_slot, pair_slot, quads_slot, score, small_straight_slot, trips_slot, two_pair_slot as two_pairs_slot, yahtzee_slot, type Slot } from './yahtzee.slots'
import * as _ from 'lodash/fp'

type DieArray<T> = { [key in DieValue]: T }

export const upper_section_slots: DieArray<Slot> = {
  [1]: number_slot(1),
  [2]: number_slot(2),
  [3]: number_slot(3),
  [4]: number_slot(4),
  [5]: number_slot(5),
  [6]: number_slot(6),
} as const

export type UpperSectionScores = DieArray<number | undefined>

export type UpperSection = Readonly<{
  scores: UpperSectionScores,
  bonus?: 0 | 50
}>

function die_array<T>(gen:(n:number) => T): DieArray<T> {
  return _.fromPairs(die_values.map(_.juxt([_.identity, gen]))) as DieArray<T>
}

function values<T>(dArr: DieArray<T>): T[] {
  return die_values.map(v => dArr[v])
}

export function upper_section(): UpperSection {
  return { 
    scores: die_array(_ => undefined)
  }
}

export function sum_upper(scores: DieArray<number | undefined>): number {
  return _.sum(values(scores).map(v => v ?? 0))
}

export function finished_upper(section: UpperSection): boolean {
  return values(section.scores).every(s => s !== undefined)
}

export function register_upper(value: DieValue, roll: DieValue[], section: UpperSection): UpperSection {
  const registered = _.set(['scores', value], score(upper_section_slots[value], roll), section)
  if (finished_upper(registered)) {
    return _.set('bonus', sum_upper(registered.scores) >= 63? 50 : 0, registered)
  }
  return registered
}

export function total_upper(section: UpperSection): number {
  return sum_upper(section.scores) + (section.bonus ?? 0)
}

export const lower_section_slots = {
  'pair': pair_slot,
  'two pairs': two_pairs_slot,
  'three of a kind': trips_slot,
  'four of a kind': quads_slot,
  'full house': full_house_slot,
  'small straight': small_straight_slot,
  'large straight': large_straight_slot,
  'chance': chance_slot,
  'yahtzee': yahtzee_slot
} as const


type LowerSectionSlots = typeof lower_section_slots

export type LowerSectionKey = keyof LowerSectionSlots

export type SlotKey = DieValue | LowerSectionKey

export const lower_section_keys: Readonly<LowerSectionKey[]> = Object.keys(lower_section_slots) as LowerSectionKey[]

export function isLowerSection(key: any): key is LowerSectionKey {
  return lower_section_keys.indexOf(key) !== -1
}

export type LowerSectionScores = Partial<Record<LowerSectionKey, number>>

export type LowerSection = {
  scores: LowerSectionScores
}

export function lower_section(): LowerSection {
  return { scores: { }}
}

export function finished_lower(section: LowerSection): boolean {
  return lower_section_keys.every(key => section.scores[key] !== undefined)
}

export function register_lower(key: LowerSectionKey, roll: DieValue[], section: LowerSection):  LowerSection {
  return _.set(['scores', key], score(lower_section_slots[key], roll), section)
}

export function total_lower(section: LowerSection): number {
  return _.sum(lower_section_keys.map(k => section.scores[k] ?? 0))
}

export const slots = {...upper_section_slots, ...lower_section_slots}
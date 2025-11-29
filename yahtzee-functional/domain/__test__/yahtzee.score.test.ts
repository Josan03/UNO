import { describe, it, expect } from '@jest/globals'
import { lower_section, lower_section_keys, LowerSection, register_lower, register_upper, total_lower, total_upper, upper_section, UpperSection } from '../src/model/yahtzee.score'
import { die_values } from '../src/model/dice'
import * as _ from 'lodash/fp'

describe("Upper section", () => {
  describe("new", () => {
    const section = upper_section()

    it("has undefined for all scores", () => {
      expect(die_values.map(d => section.scores[d])).toEqual(_.times(_.constant(undefined), 6))
    })

    it("has undefined bonus", () => {
      expect(section.bonus).toEqual(undefined)
    })
  })

  describe("registering first score", () => {
    const section = upper_section()
    const registered = register_upper(3, [3, 1, 3, 2, 6], section)
    it("Registers the score in the appropriate slot", () => {
      expect(registered.scores[3]).toEqual(6)
    })
    it("Keeps the bonus as undefined", () => {
      expect(registered.bonus).toEqual(undefined)
    })
  })

  describe("registering last score", () => {
    const section: UpperSection = {
      scores: {
        [1]: undefined,
        [2]: 6,
        [3]: 6,
        [4]: 16,
        [5]: 15,
        [6]: 18
      }
    }
    it("fills the bonus with 50 if total >= 63", () => {
      const registered = register_upper(1, [6, 2, 1, 6, 1], section)
      expect(registered.bonus).toEqual(50)
    })
    it("fills the bonus with 50 if total < 63", () => {
      const registered = register_upper(1, [6, 2, 1, 6, 6], section)
      expect(registered.bonus).toEqual(0)
    })
  })

  describe("totalling the section", () => {
    const section: UpperSection = {
      scores: {
        [1]: undefined,
        [2]: 6,
        [3]: 6,
        [4]: 16,
        [5]: 15,
        [6]: 18
      }
    }
    it("adds all the defined scores", () => {
      expect(total_upper(section)).toEqual(6 + 6 + 16 + 15 + 18)
    })
    it("adds the bonus if defined", () => {
      const registered = register_upper(1, [6, 2, 1, 6, 1], section)
      expect(total_upper(registered)).toEqual(2 + 6 + 6 + 16 + 15 + 18 + 50)
    })
  })
})

describe("lower section", () => {
  describe("new", () => {
    const section: LowerSection = lower_section()
    it("has undefined for all scores", () => {
      expect(lower_section_keys.map(k => section.scores[k])).toEqual(Array.from(new Array(lower_section_keys.length), _ => undefined))
    })
  })

  describe("registering a score", () => {
    const section = lower_section()
    it("Registers the score in the appropriate slot", () => {
      const registered = register_lower('pair', [3, 1, 3, 2, 6], section)
      expect(registered.scores['pair']).toEqual(6)
    })
    it("Registers the score as 0 if the roll doesn't match the slot", () => {
      const registered = register_lower('full house', [3, 1, 3, 2, 6], section)
      expect(registered.scores['full house']).toEqual(0)
    })
  })

  describe("totalling the section", () => {
    const section: LowerSection = {
      scores: {
        pair: 6,
        ['two pairs']: 6,
        ['small straight']: 15,
        chance: 25,
        yahtzee: 18
      }
    }
    it("adds all the defined scores", () => {
      expect(total_lower(section)).toEqual(6 + 6 + 15 + 25 + 18)
    })
  })
})
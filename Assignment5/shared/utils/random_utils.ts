export type Randomizer = (bound: number) => number

export const standardRandomizer: Randomizer = n => Math.floor(Math.random() * n)

export type Shuffler<T> = (ts: Readonly<T[]>) => T[]

export function standardShuffler<T>(ts: Readonly<T[]>): T[] {
    const shuffled = [...ts]
    for (let i = 0; i < shuffled.length - 1; i++) {
        const j = Math.floor(Math.random() * (shuffled.length - i) + i)
        const temp = shuffled[j]
        shuffled[j] = shuffled[i]
        shuffled[i] = temp
    }
    return shuffled
}

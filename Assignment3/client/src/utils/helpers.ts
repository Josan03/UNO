export function findPlayerIndexfromList(player: string | undefined, list: string[] | undefined) {
  if (player === undefined || list === undefined) {
    return
  } else {
    for (let index = 0; index < list.length; index++) {
      if (list[index] === player) return index
    }
  }
}

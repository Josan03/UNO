import { Card, Color, ColoredAction, Numbered, Wild } from "../model/card";

export function isNumbered(c: Card): c is Numbered {
  return c.type === "NUMBERED";
}

export function isColoredAction(c: Card): c is ColoredAction {
  return c.type === "SKIP" || c.type === "REVERSE" || c.type === "DRAW";
}

export function isWild(c: Card): c is Wild {
  return c.type === "WILD" || c.type === "WILD DRAW";
}

export function hasColor(c: Card): c is Numbered | ColoredAction {
  return isNumbered(c) || isColoredAction(c);
}

// Pure checker (recommended to export for unit tests)
export function canPlayOn(
  card: Card,
  top: Card | undefined,
  currentColor?: Color
): boolean {
  if (!top) return true;

  // Wilds can always be played
  if (isWild(card)) return true;

  // If a previous WILD set a current color, honor it first
  if (currentColor && hasColor(card)) {
    if (card.color === currentColor) return true;
  } else if (hasColor(card) && hasColor(top)) {
    // Otherwise match physical color on top card
    if (card.color === top.color) return true;
  }

  // Number match (NUMBERED vs NUMBERED)
  if (isNumbered(card) && isNumbered(top) && card.number === top.number) {
    return true;
  }

  // Action type match (e.g., SKIP on SKIP)
  if (isColoredAction(card) && isColoredAction(top) && card.type === top.type) {
    return true;
  }

  return false;
}

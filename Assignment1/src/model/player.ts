import { Card } from "./card";
import { Deck } from "./deck";

class Player {
  id: string;
  name: string;
  cards: Card[];

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }

  getInitialCards(deck: Deck) {
    this.cards = deck.deal();
  }

  drawOneCard(deck: Deck) {
    const newCard = deck.deal();
    if (newCard != undefined) this.cards.push(newCard);
  }

  drawTwoCard(deck: Deck) {
    this.drawOneCard(deck);
    this.drawOneCard(deck);
  }

  drawFourCards(deck: Deck) {
    this.drawOneCard(deck);
    this.drawOneCard(deck);
  }

  playOneCard(card: Card) {}

  skipRound() {}
}

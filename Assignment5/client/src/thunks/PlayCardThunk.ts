import { createAsyncThunk } from "@reduxjs/toolkit";
import type { IndexedUno } from "../model/game";
import type { Card } from "domain/src/model/deck";
import { playCard } from "../model/api";

const PlayCardThunk = createAsyncThunk(
  "PlayCard",
  async ({
    game,
    player,
    card,
  }: {
    game: IndexedUno;
    player: string;
    card: Card;
  }) => {
    return await playCard(game.id, player, card);
  }
);

export default PlayCardThunk;

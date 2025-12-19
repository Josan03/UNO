import { createAsyncThunk } from "@reduxjs/toolkit";
import type { IndexedUno } from "../model/game";
import { passTurn } from "../model/api";

const PassTurnThunk = createAsyncThunk(
  "PassTurn",
  async ({ game, player }: { game: IndexedUno; player: string }) => {
    return await passTurn(game.id, player);
  }
);

export default PassTurnThunk;

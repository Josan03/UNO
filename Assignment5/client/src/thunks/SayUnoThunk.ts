import { createAsyncThunk } from "@reduxjs/toolkit";
import type { IndexedUno } from "../model/game";
import { sayUno } from "../model/api";

const SayUnoThunk = createAsyncThunk(
  "SayUno",
  async ({ game, player }: { game: IndexedUno; player: string }) => {
    return await sayUno(game.id, player);
  }
);

export default SayUnoThunk;

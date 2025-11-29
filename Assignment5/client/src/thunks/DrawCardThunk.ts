import { createAsyncThunk } from "@reduxjs/toolkit";
import type { IndexedUno } from "../model/game";
import { drawCard } from "../model/api";

const DrawCardThunk = createAsyncThunk(
  "DrawCard",
  async ({ game, player }: { game: IndexedUno; player: string }) => {
    return await drawCard(game.id, player);
  }
);

export default DrawCardThunk;

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { IndexedUno } from "../model/game";
import { callUno } from "../model/api";

const CallUnoThunk = createAsyncThunk(
  "CallUno",
  async ({
    game,
    player,
    targetPlayer,
  }: {
    game: IndexedUno;
    player: string;
    targetPlayer: string;
  }) => {
    return await callUno(game.id, player, targetPlayer);
  }
);

export default CallUnoThunk;

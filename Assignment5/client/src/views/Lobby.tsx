import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import type { State, Dispatch } from "../stores/store";
import type { PlayerState } from "../slices/player_slice";
import NewGameThunk from "../thunks/NewGameThunk";

export default function Lobby() {
  const { player } = useSelector<State, PlayerState>((state) => state.player);
  const dispatch: Dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (player === undefined) {
      navigate("/login");
    }
  });

  const [number_of_players, set_number_of_players] = useState(2);

  const new_game = (player: string) => {
    if (player !== undefined)
      dispatch(NewGameThunk(number_of_players, player, navigate));
  };

  return (
    player && (
      <main>
        Number of players:{" "}
        <input
          min="2"
          type="number"
          value={number_of_players}
          onChange={(e) => set_number_of_players(parseInt(e.target.value))}
        />
        <button onClick={() => new_game(player)}>New Game</button>
      </main>
    )
  );
}

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router";
import type { State, Dispatch } from "../stores/store";
import type { PlayerState } from "../slices/player_slice";
import type { IndexedUnoSpecs } from "../model/game";
import type { OngoingGamesState } from "../slices/ongoing_games_slice";
import * as pending from "../slices/pending_games_slice";
import JoinThunk from "../thunks/JoinThunk";
import Page from "../components/Page";
import * as _ from "lodash/fp";

export default function Pending() {
  const params = useParams();
  const { player } = useSelector<State, PlayerState>((state) => state.player);
  const ongoing_games = useSelector<State, OngoingGamesState>(
    (state) => state.ongoing_games
  );
  const id = params.id!;
  const game = useSelector<State, IndexedUnoSpecs | undefined>((state) =>
    pending.game(id, state.pending_games)
  );
  const navigate = useNavigate();
  const dispatch: Dispatch = useDispatch();

  useEffect(() => {
    if (player === undefined) {
      navigate(`/login?pending=${id}`);
    } else if (game === undefined) {
      // Check if the game has already started (moved to ongoing)
      if (ongoing_games.some((g) => g.id === id)) {
        navigate(`/game/${id}`);
      }
    }
  }, [player, game, id, navigate, ongoing_games]);

  if (player === undefined) return <></>;

  // Show loading if game not found yet (could be loading from subscriptions)
  if (game === undefined) {
    return (
      <Page>
        <div>Loading game...</div>
      </Page>
    );
  }

  const canJoin = !game.players.some(_.equals(player));

  const join = () => {
    if (canJoin) dispatch(JoinThunk(game, player, navigate));
  };

  return (
    <Page>
      <h1>Game #{id}</h1>
      <div>Created by: {game?.creator}</div>
      <div>Players: {game?.players.join(", ")}</div>
      <div>
        Available Seats:{" "}
        {(game?.numberOfPlayers ?? 2) - (game?.players.length ?? 0)}
      </div>
      {canJoin && <button onClick={join}>Join</button>}
    </Page>
  );
}

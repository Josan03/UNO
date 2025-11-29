import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router";
import type { State, Dispatch } from "../stores/store";
import JoinThunk from "../thunks/JoinThunk";

export default function Pending() {
  const { id } = useParams<{ id: string }>();
  const player = useSelector((state: State) => state.player.player);
  const pendingGames = useSelector((state: State) => state.pending_games);
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();

  const game = pendingGames.find((g) => g.id === id);

  useEffect(() => {
    if (!player) {
      navigate("/");
    }
  }, [player, navigate]);

  if (!game) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Game Not Found</h1>
        <button onClick={() => navigate("/lobby")}>Back to Lobby</button>
      </div>
    );
  }

  const handleJoin = async () => {
    if (player) {
      await dispatch(JoinThunk(game, player));
    }
  };

  const isPlayerInGame = game.players.includes(player || "");

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Pending Game {game.id}</h1>
      <div style={{ marginBottom: "1rem" }}>
        <p>
          <strong>Players:</strong> {game.players.length} /{" "}
          {game.numberOfPlayers}
        </p>
        <ul>
          {game.players.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <p>
          <strong>Target Score:</strong> {game.targetScore}
        </p>
      </div>
      {!isPlayerInGame && (
        <button
          onClick={handleJoin}
          style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
        >
          Join Game
        </button>
      )}
      <button
        onClick={() => navigate("/lobby")}
        style={{ padding: "0.5rem 1rem" }}
      >
        Back to Lobby
      </button>
      {isPlayerInGame && (
        <p style={{ marginTop: "1rem", color: "green" }}>
          Waiting for more players to join...
        </p>
      )}
    </div>
  );
}

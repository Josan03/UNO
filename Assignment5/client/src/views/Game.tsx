import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router";
import type { State, Dispatch } from "../stores/store";
import type { IndexedUno } from "../model/game";
import * as Ongoing from "../slices/ongoing_games_slice";
import PlayCardThunk from "../thunks/PlayCardThunk";
import DrawCardThunk from "../thunks/DrawCardThunk";
import SayUnoThunk from "../thunks/SayUnoThunk";
import CallUnoThunk from "../thunks/CallUnoThunk";
import PassTurnThunk from "../thunks/PassTurnThunk";
import type { Card } from "domain/src/model/deck";
import "./Game.css";

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const player = useSelector((state: State) => state.player.player);
  const game = useSelector<State, IndexedUno | undefined>((state) =>
    Ongoing.game(id!, state.ongoing_games)
  );
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!player) {
      navigate(`/login?game=${id}`);
    }
  }, [player, id, navigate]);

  // Show loading state while game is being fetched
  if (!player) return <></>;
  if (!game) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Loading game...</h1>
      </div>
    );
  }

  const currentRound = game.currentRound;
  if (!currentRound) {
    // Game finished
    const standings = game.scores
      .map((score, idx) => ({ player: game.players[idx], score }))
      .sort((a, b) => b.score - a.score);

    return (
      <div style={{ padding: "2rem" }}>
        <h1>Game #{id} - Finished!</h1>
        <h2>Final Standings</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                Player
              </th>
              <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => (
              <tr
                key={s.player}
                style={{
                  backgroundColor:
                    s.player === player ? "#d4edda" : "transparent",
                }}
              >
                <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  {s.player}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  {s.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={() => navigate("/lobby")}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  const playerIndex = game.players.indexOf(player);
  const isMyTurn = currentRound.playerInTurn === playerIndex;
  const myHand = currentRound.hands[playerIndex] || [];
  const topCard = currentRound.discardPile[currentRound.discardPile.length - 1];
  const unoCalled = currentRound.unoCalled || [];
  const myUnoCalled = unoCalled[playerIndex];

  const handlePlayCard = (card: Card) => {
    if (isMyTurn && game) {
      dispatch(PlayCardThunk({ game, player, card }));
    }
  };

  const handleDraw = () => {
    if (isMyTurn && game) {
      dispatch(DrawCardThunk({ game, player }));
    }
  };

  const handleSayUno = () => {
    if (game) {
      dispatch(SayUnoThunk({ game, player }));
    }
  };

  const handleCallUno = (targetPlayer: string) => {
    if (game) {
      dispatch(CallUnoThunk({ game, player, targetPlayer }));
    }
  };

  const handlePassTurn = () => {
    if (isMyTurn && game) {
      dispatch(PassTurnThunk({ game, player }));
    }
  };

  const getCardColor = (card: Card) => {
    if ("color" in card) {
      return card.color;
    }
    return "BLACK";
  };

  const getCardDisplay = (card: Card) => {
    if (card.type === "NUMBERED") return (card as any).number.toString();
    if (card.type === "SKIP") return "SKIP";
    if (card.type === "REVERSE") return "⇄";
    if (card.type === "DRAW") return "+2";
    if (card.type === "WILD") return "WILD";
    if (card.type === "WILD_DRAW") return "WILD +4";
    return "?";
  };

  const renderCard = (
    card: Card,
    onClick?: () => void,
    isPlayable?: boolean
  ) => {
    const color = getCardColor(card);
    const display = getCardDisplay(card);
    const backgroundColor =
      color === "RED"
        ? "#ff0000"
        : color === "YELLOW"
        ? "#ffff00"
        : color === "GREEN"
        ? "#00ff00"
        : color === "BLUE"
        ? "#0000ff"
        : "#000000";

    return (
      <div
        onClick={onClick}
        style={{
          width: "80px",
          height: "120px",
          border: "2px solid #333",
          borderRadius: "8px",
          backgroundColor,
          color: color === "YELLOW" ? "#000" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "1.2rem",
          cursor: onClick
            ? isPlayable
              ? "pointer"
              : "not-allowed"
            : "default",
          opacity: isPlayable === false ? 0.5 : 1,
          margin: "0.25rem",
        }}
      >
        {display}
      </div>
    );
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Game #{id}</h1>
      <div style={{ marginBottom: "1rem" }}>
        <strong>Current Player:</strong>{" "}
        {game.players[currentRound.playerInTurn!]}
        {isMyTurn && " (Your Turn)"}
      </div>

      {/* Scores */}
      <div style={{ marginBottom: "1rem" }}>
        <strong>Scores:</strong>
        {game.players.map((p, idx) => (
          <span key={p} style={{ marginLeft: "1rem" }}>
            {p}: {game.scores[idx]}
          </span>
        ))}
      </div>

      {/* Top Card */}
      <div style={{ marginBottom: "1rem" }}>
        <strong>Top Card:</strong>
        <div style={{ display: "inline-block", marginLeft: "1rem" }}>
          {renderCard(topCard)}
        </div>
      </div>

      {/* My Hand */}
      <div style={{ marginBottom: "1rem" }}>
        <strong>Your Hand ({myHand.length} cards):</strong>
        {myHand.length === 1 && !myUnoCalled && (
          <span style={{ color: "red", marginLeft: "1rem" }}>⚠ Say UNO!</span>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: "0.5rem" }}>
          {myHand.map((card, idx) => (
            <div key={idx}>
              {renderCard(card, () => handlePlayCard(card), isMyTurn)}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={handleDraw}
          disabled={!isMyTurn}
          style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
        >
          Draw Card
        </button>
        <button
          onClick={handlePassTurn}
          disabled={!isMyTurn}
          style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
        >
          Pass Turn
        </button>
        <button
          onClick={handleSayUno}
          disabled={myHand.length !== 2}
          style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
        >
          Say UNO
        </button>
      </div>

      {/* Other Players */}
      <div>
        <strong>Other Players:</strong>
        {game.players.map((p, idx) => {
          if (p === player) return null;
          const handSize = currentRound.hands[idx]?.length || 0;
          const theirUnoCalled = unoCalled[idx];
          return (
            <div key={p} style={{ marginTop: "0.5rem" }}>
              {p}: {handSize} cards
              {handSize === 1 && !theirUnoCalled && (
                <button
                  onClick={() => handleCallUno(p)}
                  style={{ marginLeft: "1rem", padding: "0.25rem 0.5rem" }}
                >
                  Call UNO!
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/lobby")}
        style={{ marginTop: "2rem", padding: "0.5rem 1rem" }}
      >
        Back to Lobby
      </button>
    </div>
  );
}

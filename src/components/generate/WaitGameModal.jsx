import { useState } from "react";
import { X, Gamepad2, Sparkles } from "lucide-react";
import RPSGame from "./games/RPSGame";
import DinoGame, { WIDTH as DINO_W, HEIGHT as DINO_H } from "./games/DinoGame";
import FlappyGame, { WIDTH as FLAPPY_W, HEIGHT as FLAPPY_H } from "./games/FlappyGame";
import RacingGame, { WIDTH as RACING_W, HEIGHT as RACING_H } from "./games/RacingGame";
import GameScaler from "./games/GameScaler";

const GAMES = [
  { id: "dino", label: "Dino Jump", component: DinoGame, width: DINO_W, height: DINO_H },
  { id: "flappy", label: "Flappy", component: FlappyGame, width: FLAPPY_W, height: FLAPPY_H },
  { id: "racing", label: "Mini Racer", component: RacingGame, width: RACING_W, height: RACING_H },
  { id: "rps", label: "Rock Paper Scissors", component: RPSGame },
];

export default function WaitGameModal({ open, onClose, ready, onViewResults }) {
  const [selected, setSelected] = useState(null);

  if (!open) return null;

  const selectedGame = GAMES.find((g) => g.id === selected);
  const Game = selectedGame?.component;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
      <div className="glass-card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-text">{selectedGame ? selectedGame.label : "Play while you wait"}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {ready && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary-soft p-3">
            <span className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles size={15} /> Documents ready!
            </span>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="text-xs font-medium text-muted hover:text-text">
                Keep playing
              </button>
              <button
                onClick={onViewResults}
                className="cta-glow rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
              >
                View results
              </button>
            </div>
          </div>
        )}

        {!selected ? (
          <div className="flex flex-col gap-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelected(g.id)}
                className="rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm font-medium text-text hover:border-primary/40"
              >
                {g.label}
              </button>
            ))}
          </div>
        ) : (
          <div>
            {selectedGame.width ? (
              <GameScaler width={selectedGame.width} height={selectedGame.height}>
                <Game />
              </GameScaler>
            ) : (
              <Game />
            )}
            <button onClick={() => setSelected(null)} className="mt-1 text-xs font-medium text-muted hover:text-text">
              ← Choose a different game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

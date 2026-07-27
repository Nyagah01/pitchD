import { useEffect, useRef, useState } from "react";
import { useGameLoop } from "./useGameLoop";

export const WIDTH = 220;
export const HEIGHT = 360;
const CAR_W = 30;
const CAR_H = 48;
const PLAYER_Y = HEIGHT - 66;
const OBSTACLE_H = 48;
const MOVE_SPEED = 420;

export default function RacingGame() {
  const [playerX, setPlayerX] = useState(WIDTH / 2 - CAR_W / 2);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(true);

  const playerXRef = useRef(playerX);
  const keysRef = useRef({ left: false, right: false });
  const dragTargetRef = useRef(null);
  const spawnTimerRef = useRef(0.6);
  const nextIdRef = useRef(0);
  const areaRef = useRef(null);
  const gameOverRef = useRef(false);

  useEffect(() => {
    playerXRef.current = playerX;
  }, [playerX]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  function restart() {
    setPlayerX(WIDTH / 2 - CAR_W / 2);
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    spawnTimerRef.current = 0.6;
    setRunning(true);
  }

  function handlePointer(e) {
    if (gameOverRef.current) {
      restart();
      return;
    }
    const rect = areaRef.current.getBoundingClientRect();
    // rect reflects the actual on-screen (possibly CSS-scaled) size, so convert
    // back to the game's own logical coordinate space rather than assuming 1:1 pixels.
    const scaleFactor = rect.width / WIDTH;
    dragTargetRef.current = (e.clientX - rect.left) / scaleFactor - CAR_W / 2;
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();
    }
    function onKeyUp(e) {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useGameLoop((dtMs) => {
    const dt = dtMs / 1000;
    const speed = 160 + Math.min(score, 300) * 1.4;

    let x = playerXRef.current;
    if (dragTargetRef.current != null) {
      x += (dragTargetRef.current - x) * Math.min(dt * 10, 1);
    } else {
      if (keysRef.current.left) x -= MOVE_SPEED * dt;
      if (keysRef.current.right) x += MOVE_SPEED * dt;
    }
    x = Math.max(4, Math.min(WIDTH - CAR_W - 4, x));

    spawnTimerRef.current -= dt;
    let nextObstacles = obstacles.map((o) => ({ ...o, y: o.y + speed * dt })).filter((o) => o.y < HEIGHT + OBSTACLE_H);

    if (spawnTimerRef.current <= 0) {
      const obX = 4 + Math.random() * (WIDTH - CAR_W - 8);
      nextObstacles.push({ id: nextIdRef.current++, x: obX, y: -OBSTACLE_H });
      spawnTimerRef.current = Math.max(0.45, 0.95 - Math.min(score / 250, 0.5));
    }

    let died = false;
    for (const o of nextObstacles) {
      const overlapX = o.x < x + CAR_W && o.x + CAR_W > x;
      const overlapY = o.y < PLAYER_Y + CAR_H && o.y + OBSTACLE_H > PLAYER_Y;
      if (overlapX && overlapY) died = true;
    }

    setPlayerX(x);
    setObstacles(nextObstacles);
    if (!died) setScore((s) => s + dt * 12);
    if (died) {
      setGameOver(true);
      setRunning(false);
    }
  }, running);

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-xs text-muted">
        Score: {Math.floor(score)}
        {score > 50 ? " · traffic's heavier now" : ""}
      </p>
      <div
        ref={areaRef}
        onPointerDown={handlePointer}
        onPointerMove={(e) => e.buttons === 1 && handlePointer(e)}
        onPointerUp={() => (dragTargetRef.current = null)}
        onPointerLeave={() => (dragTargetRef.current = null)}
        className="relative touch-none select-none overflow-hidden rounded-xl border border-border bg-[#2b2b33]"
        style={{ width: WIDTH, height: HEIGHT }}
      >
        <div className="absolute inset-y-0 left-1/3 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-2/3 w-px bg-white/10" />

        <div className="absolute rounded-md bg-amber-400" style={{ width: CAR_W, height: CAR_H, left: playerX, top: PLAYER_Y }} />
        {obstacles.map((o) => (
          <div key={o.id} className="absolute rounded-md bg-rose-500" style={{ width: CAR_W, height: OBSTACLE_H, left: o.x, top: o.y }} />
        ))}

        {!gameOver && <p className="absolute right-2 top-2 text-[10px] text-white/40">← → or drag</p>}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
            <p className="text-sm font-bold text-white">Crashed — {Math.floor(score)}</p>
            <button onClick={restart} className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

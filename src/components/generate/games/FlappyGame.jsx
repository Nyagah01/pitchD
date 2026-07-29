import { useEffect, useRef, useState } from "react";
import { useGameLoop } from "./useGameLoop";

export const WIDTH = 300;
export const HEIGHT = 360;
const BIRD_SIZE = 22;
const BIRD_X = 60;
const GRAVITY = 1400;
const FLAP_V = -420;
const PIPE_W = 44;

export default function FlappyGame() {
  const [birdY, setBirdY] = useState(HEIGHT / 2);
  const [pipes, setPipes] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(true);
  const [started, setStarted] = useState(false);

  const velocityRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const nextIdRef = useRef(0);
  const passedRef = useRef(new Set());

  function flap() {
    if (gameOver) {
      restart();
      return;
    }
    if (!started) setStarted(true);
    velocityRef.current = FLAP_V;
  }

  function restart() {
    setBirdY(HEIGHT / 2);
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setStarted(false);
    velocityRef.current = 0;
    spawnTimerRef.current = 0;
    passedRef.current = new Set();
    setRunning(true);
  }

  useGameLoop((dtMs) => {
    if (!started) return;
    const dt = dtMs / 1000;
    const speed = 130 + Math.min(score, 60) * 2.2;
    const gap = score > 50 ? 105 : 130;

    const newV = velocityRef.current + GRAVITY * dt;
    const newY = birdY + newV * dt;
    velocityRef.current = newV;

    let nextPipes = pipes.map((p) => ({ ...p, x: p.x - speed * dt })).filter((p) => p.x > -PIPE_W);

    spawnTimerRef.current -= dt;
    if (spawnTimerRef.current <= 0) {
      const gapY = 50 + Math.random() * (HEIGHT - 100 - gap);
      nextPipes.push({ id: nextIdRef.current++, x: WIDTH, gapY, gap });
      spawnTimerRef.current = 1.6;
    }

    let died = newY < 0 || newY + BIRD_SIZE > HEIGHT;
    let newScore = score;
    for (const p of nextPipes) {
      const overlapX = p.x < BIRD_X + BIRD_SIZE && p.x + PIPE_W > BIRD_X;
      if (overlapX) {
        const inGap = newY > p.gapY && newY + BIRD_SIZE < p.gapY + p.gap;
        if (!inGap) died = true;
      }
      if (!died && p.x + PIPE_W < BIRD_X && !passedRef.current.has(p.id)) {
        passedRef.current.add(p.id);
        newScore += 1;
      }
    }

    setBirdY(newY);
    setPipes(nextPipes);
    if (newScore !== score) setScore(newScore);
    if (died) {
      setGameOver(true);
      setRunning(false);
    }
  }, running);

  useEffect(() => {
    function onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        flap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-xs text-muted">
        Score: {score}
        {score > 50 ? " · getting tighter" : ""}
      </p>
      <div
        onPointerDown={flap}
        className="relative touch-none select-none cursor-pointer overflow-hidden rounded-xl border border-border"
        style={{ width: WIDTH, height: HEIGHT, background: "linear-gradient(#bee7ff, #eaf8ff)" }}
      >
        <div
          className="absolute rounded-full bg-amber-400 shadow"
          style={{ width: BIRD_SIZE, height: BIRD_SIZE, left: BIRD_X, top: birdY }}
        />
        {pipes.map((p) => (
          <div key={p.id}>
            <div className="absolute bg-emerald-500" style={{ left: p.x, width: PIPE_W, top: 0, height: p.gapY }} />
            <div className="absolute bg-emerald-500" style={{ left: p.x, width: PIPE_W, top: p.gapY + p.gap, bottom: 0 }} />
          </div>
        ))}
        {!started && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <p className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#111]">Tap / space to flap</p>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35">
            <p className="text-sm font-bold text-white">Game over — {score}</p>
            <button onClick={restart} className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

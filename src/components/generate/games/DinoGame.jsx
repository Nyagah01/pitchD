import { useEffect, useRef, useState } from "react";
import { useGameLoop } from "./useGameLoop";

export const WIDTH = 340;
export const HEIGHT = 150;
const GROUND = 118;
const DINO = 26;
const GRAVITY = 2000;
const JUMP_V = -650;
const OBSTACLE_W = 14;
const OBSTACLE_H = 22;
const DINO_X = 30;

export default function DinoGame() {
  const [dinoY, setDinoY] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(true);
  const [started, setStarted] = useState(false);

  const velocityRef = useRef(0);
  const spawnTimerRef = useRef(1);
  const nextIdRef = useRef(0);
  const dinoYRef = useRef(0);

  useEffect(() => {
    dinoYRef.current = dinoY;
  }, [dinoY]);

  function jump() {
    if (gameOver) {
      restart();
      return;
    }
    if (!started) setStarted(true);
    if (dinoYRef.current === 0) velocityRef.current = JUMP_V;
  }

  function restart() {
    setDinoY(0);
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    setStarted(false);
    velocityRef.current = 0;
    spawnTimerRef.current = 1;
    setRunning(true);
  }

  useGameLoop((dtMs) => {
    const dt = dtMs / 1000;
    const speed = 220 + Math.min(score, 300) * 1.2;

    let newV = velocityRef.current + GRAVITY * dt;
    let newY = dinoYRef.current + newV * dt;
    if (newY > 0) {
      newY = 0;
      newV = 0;
    }
    velocityRef.current = newV;

    spawnTimerRef.current -= dt;
    let nextObstacles = obstacles.map((o) => ({ ...o, x: o.x - speed * dt })).filter((o) => o.x > -OBSTACLE_W);
    if (spawnTimerRef.current <= 0) {
      nextObstacles.push({ id: nextIdRef.current++, x: WIDTH });
      spawnTimerRef.current = 1.1 + Math.random() * 0.8 - Math.min(score / 400, 0.4);
    }

    const dinoTop = GROUND - DINO + newY;
    let died = false;
    for (const o of nextObstacles) {
      const overlapX = o.x < DINO_X + DINO && o.x + OBSTACLE_W > DINO_X;
      const overlapY = dinoTop + DINO > GROUND - OBSTACLE_H;
      if (overlapX && overlapY) died = true;
    }

    setDinoY(newY);
    setObstacles(nextObstacles);
    if (!died) setScore((s) => s + dt * 10);
    if (died) {
      setGameOver(true);
      setRunning(false);
    }
  }, running);

  useEffect(() => {
    function onKey(e) {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-xs text-muted">
        Score: {Math.floor(score)}
        {score > 50 ? " · speeding up" : ""}
      </p>
      <div
        onClick={jump}
        className="relative cursor-pointer overflow-hidden rounded-xl border border-border bg-[#f7f7f7]"
        style={{ width: WIDTH, height: HEIGHT }}
      >
        <div className="absolute left-0 right-0 border-t border-[#535353]" style={{ top: GROUND }} />
        <div
          className="absolute rounded-sm bg-[#535353]"
          style={{ width: DINO, height: DINO, left: DINO_X, top: GROUND - DINO + dinoY }}
        />
        {obstacles.map((o) => (
          <div
            key={o.id}
            className="absolute rounded-sm bg-[#535353]"
            style={{ width: OBSTACLE_W, height: OBSTACLE_H, left: o.x, top: GROUND - OBSTACLE_H }}
          />
        ))}
        {!started && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <p className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#535353]">Tap / space to jump</p>
          </div>
        )}
        {started && !gameOver && <p className="absolute right-2 top-2 text-[10px] text-[#999]">tap / space</p>}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85">
            <p className="text-sm font-bold text-[#535353]">Game over — {Math.floor(score)}</p>
            <button onClick={restart} className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

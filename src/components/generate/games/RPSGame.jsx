import { useState } from "react";

const CHOICES = ["rock", "paper", "scissors"];
const EMOJI = { rock: "🪨", paper: "📄", scissors: "✂️" };
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

export default function RPSGame() {
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [history, setHistory] = useState([]);
  const [last, setLast] = useState(null);

  function play(choice) {
    const nextRounds = rounds + 1;
    let computer;

    if (nextRounds > 50) {
      // Past 50 rounds the computer starts weighting toward countering your most common move.
      const freq = {};
      [...history, choice].forEach((c) => (freq[c] = (freq[c] || 0) + 1));
      const favorite = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
      const counter = Object.keys(BEATS).find((k) => BEATS[k] === favorite);
      computer = Math.random() < 0.4 ? counter : CHOICES[Math.floor(Math.random() * 3)];
    } else {
      computer = CHOICES[Math.floor(Math.random() * 3)];
    }

    const result = computer === choice ? "tie" : BEATS[choice] === computer ? "win" : "lose";

    setScore((s) => s + (result === "win" ? 1 : result === "lose" ? -1 : 0));
    setRounds(nextRounds);
    setHistory((h) => [...h, choice].slice(-20));
    setLast({ player: choice, computer, result });
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="text-center">
        <p className="font-header text-3xl font-extrabold text-text">{score}</p>
        <p className="text-xs text-muted">
          score · round {rounds}
          {rounds > 50 ? " · it's onto your patterns now" : ""}
        </p>
      </div>

      {last && (
        <div className="flex items-center gap-4 text-4xl">
          <span>{EMOJI[last.player]}</span>
          <span className="text-sm text-muted">vs</span>
          <span>{EMOJI[last.computer]}</span>
        </div>
      )}
      {last && (
        <p
          className={`text-sm font-semibold ${
            last.result === "win" ? "text-accent" : last.result === "lose" ? "text-danger" : "text-muted"
          }`}
        >
          {last.result === "win" ? "You win!" : last.result === "lose" ? "Computer wins" : "Tie"}
        </p>
      )}

      <div className="flex gap-3">
        {CHOICES.map((c) => (
          <button
            key={c}
            onClick={() => play(c)}
            className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface text-3xl transition-transform hover:scale-105 hover:border-primary/50"
          >
            {EMOJI[c]}
          </button>
        ))}
      </div>
    </div>
  );
}

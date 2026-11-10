import type { ChessEngine } from "./ChessEngine";
import type { Move } from "chess.js";

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

function materialScore(engine: ChessEngine): number {
  let score = 0;
  const board = engine.fen().split(" ")[0];
  for (const ch of board) {
    if (ch === "/" || /\d/.test(ch)) continue;
    const lower = ch.toLowerCase();
    const val = PIECE_VALUES[lower] ?? 0;
    score += ch === lower ? -val : val;
  }
  return score;
}

function staticEval(engine: ChessEngine): number {
  const snap = engine.snapshot();
  if (snap.isGameOver && snap.outcome?.includes("mat")) {
    return snap.turn === "w" ? -50000 : 50000;
  }
  let s = materialScore(engine);
  if (snap.inCheck) {
    s += engine.turn === "w" ? -25 : 25;
  }
  return s;
}

function search(engine: ChessEngine, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || engine.snapshot().isGameOver) {
    return staticEval(engine);
  }

  const moves = engine.allLegalMoves();
  const maximizing = engine.turn === "w";

  if (maximizing) {
    let value = -Infinity;
    for (const move of moves) {
      engine.move({ from: move.from, to: move.to, promotion: move.promotion as "q" | undefined });
      value = Math.max(value, search(engine, depth - 1, alpha, beta));
      engine.undo();
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value === -Infinity ? staticEval(engine) : value;
  }

  let value = Infinity;
  for (const move of moves) {
    engine.move({ from: move.from, to: move.to, promotion: move.promotion as "q" | undefined });
    value = Math.min(value, search(engine, depth - 1, alpha, beta));
    engine.undo();
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value === Infinity ? staticEval(engine) : value;
}

/** IA adverse (Noirs) — minimax alpha-bêta, profondeur 3 */
export function pickAIMove(engine: ChessEngine): Move | null {
  const moves = engine.allLegalMoves().filter((m) => m.color === "b");
  if (moves.length === 0) return null;

  let best: Move | null = null;
  let bestScore = Infinity;

  const ordered = [...moves].sort((a, b) => {
    const ca = a.captured ? PIECE_VALUES[a.captured] ?? 0 : 0;
    const cb = b.captured ? PIECE_VALUES[b.captured] ?? 0 : 0;
    return cb - ca;
  });

  for (const move of ordered) {
    engine.move({ from: move.from, to: move.to, promotion: move.promotion as "q" | undefined });
    let score = search(engine, 2, -Infinity, Infinity);
    score += (Math.random() - 0.5) * 6;
    engine.undo();

    if (score < bestScore) {
      bestScore = score;
      best = move;
    }
  }

  return best ?? moves[0]!;
}

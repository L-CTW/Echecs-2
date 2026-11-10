import type { Square } from "chess.js";

export const SQUARE_SIZE = 1;
export const BOARD_HALF = 4;

export function squareToWorld(square: Square): { x: number; z: number } {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = parseInt(square[1]!, 10) - 1;
  return {
    x: (file - 3.5) * SQUARE_SIZE,
    z: (3.5 - rank) * SQUARE_SIZE,
  };
}

export function worldToSquare(x: number, z: number): Square | null {
  const file = Math.round(x / SQUARE_SIZE + 3.5);
  const rank = Math.round(3.5 - z / SQUARE_SIZE);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${String.fromCharCode("a".charCodeAt(0) + file)}${rank + 1}` as Square;
}

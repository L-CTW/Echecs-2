import { Chess, type Color, type Move, type Square } from "chess.js";

export type GameSnapshot = {
  fen: string;
  turn: Color;
  inCheck: boolean;
  isGameOver: boolean;
  outcome: string | null;
};

export class ChessEngine {
  private chess = new Chess();

  reset(): void {
    this.chess.reset();
  }

  loadFen(fen: string): boolean {
    try {
      this.chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  get turn(): Color {
    return this.chess.turn();
  }

  fen(): string {
    return this.chess.fen();
  }

  snapshot(): GameSnapshot {
    return {
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      inCheck: this.chess.inCheck(),
      isGameOver: this.chess.isGameOver(),
      outcome: this.outcomeText(),
    };
  }

  private outcomeText(): string | null {
    if (!this.chess.isGameOver()) return null;
    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === "w" ? "Noirs" : "Blancs";
      return `Échec et mat — victoire des ${winner}`;
    }
    if (this.chess.isDraw()) {
      if (this.chess.isStalemate()) return "Pat — partie nulle";
      if (this.chess.isThreefoldRepetition()) return "Nulle — triple répétition";
      if (this.chess.isInsufficientMaterial()) return "Nulle — matériel insuffisant";
      return "Partie nulle";
    }
    return null;
  }

  legalMovesFrom(square: Square): Move[] {
    return this.chess.moves({ square, verbose: true }) as Move[];
  }

  allLegalMoves(): Move[] {
    return this.chess.moves({ verbose: true }) as Move[];
  }

  move(move: { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" }): Move | null {
    try {
      return this.chess.move(move) as Move;
    } catch {
      return null;
    }
  }

  undo(): Move | null {
    const m = this.chess.undo();
    return m as Move | null;
  }

  get(square: Square) {
    return this.chess.get(square);
  }
}

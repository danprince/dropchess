import { Game, white, black } from "./game.js";

/**
 * @import { Tile, Piece, Color, Move } from "./game.js";
 *
 * @typedef {object} Square
 * @prop {Tile} tile
 * @prop {Color} color
 * @prop {boolean} selected
 * @prop {Piece | undefined} piece
 * @prop {Move | undefined} [move]
 *
 * @typedef {object} Room
 * @prop {Color[]} players
 * @prop {Color} turn
 */

class SingleplayerApp {
  /**
   * @type {Game}
   */
  game = new Game();

  /**
   * The piece that is currently selected.
   * @type {Piece | undefined}
   */
  selectedPiece;

  init() {
    this.game = new Game();
  }

  /**
   * Select a piece.
   * @param {Piece | undefined} piece
   */
  selectPiece(piece) {
    this.selectedPiece = piece;
  }

  /**
   * @param {Move} move
   */
  play(move) {
    if (this.selectedPiece) {
      this.game.play(this.selectedPiece, move);
      this.selectPiece(undefined);
    }

    // Wait for animations to finish before checking for the winner
    setTimeout(() => this.checkWin(), 400);
  }

  checkWin() {
    if (this.game.winner) {
      alert(`${this.game.winner} wins!`);
      this.init();
    }
  }

  /**
   * Squares are just a useful abstraction which makes it easier for Alpine to
   * render tiles.
   * @returns {Square[]}
   */
  getSquares() {
    let moves = this.selectedPiece
      ? this.game.getMoves(this.selectedPiece)
      : [];

    return this.game.tiles.map((tile) => {
      let piece = this.game.getPiece(tile);

      let move = moves.find((move) => move.x === tile.x && move.y === tile.y);

      let selected =
        tile.x === this.selectedPiece?.x && tile.y === this.selectedPiece.y;

      let checker = tile.x % 2 ? tile.y % 2 : (tile.y + 1) % 2;
      /** @type {Color} */
      let color = checker ? white : black;

      return { tile, color, move, selected, piece };
    });
  }
}

Object.assign(window, { SingleplayerApp });

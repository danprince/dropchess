// @ts-ignore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { black, Game, white } from "./chess.js";

import {
  getFirestore,
  getDoc,
  updateDoc,
  onSnapshot,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

/**
 * @import { DocumentReference } from "@firebase/firestore";
 * @import { Piece, Tile, Move, Color } from "./chess.js";
 */

/**
 * @typedef {object} Room
 * @prop {Piece[]} pieces
 * @prop {Tile[]} tiles
 * @prop {number | null} selectedPieceId
 *
 * @typedef {number[]} GameState
 *
 * @typedef {object} Square
 * @prop {Tile} tile
 * @prop {Color} color
 * @prop {boolean} selected
 * @prop {Piece | undefined} piece
 * @prop {Move | undefined} [move]
 */

const firebase = initializeApp({
  apiKey: "AIzaSyB0lN4l5FOzDaIBX2UBoAhktnLXFEAv6Qs",
  authDomain: "dropchess2.firebaseapp.com",
  projectId: "dropchess2",
  storageBucket: "dropchess2.firebasestorage.app",
  messagingSenderId: "260031377800",
  appId: "1:260031377800:web:f46e08dbe24520eb2d8a3d",
});

const firestore = getFirestore(firebase);

const roomId = location.hash.slice(1) || "default";

const roomDoc = /** @type {DocumentReference<Room, Room>} */ (
  doc(firestore, "rooms", roomId)
);

class MultiplayerApp {
  game = new Game();

  /**
   * The piece that is currently selected.
   * @type {number | null}
   */
  selectedPieceId = null;

  /**
   * Select a piece.
   * @param {Piece | undefined} piece
   */
  selectPiece(piece) {
    this.selectedPieceId = piece?.id ?? null;

    updateDoc(roomDoc, {
      selectedPieceId: this.selectedPieceId,
    });
  }

  getSelectedPiece() {
    return this.game.pieces.find((piece) => piece.id === this.selectedPieceId);
  }

  /**
   * Play a specific move with the selected piece.
   * @param {Move} move
   */
  play(move) {
    let piece = this.getSelectedPiece();

    if (piece) {
      this.game.play(piece, move);
      this.selectPiece(undefined);
      this.sync();
    }
  }

  /**
   * @returns {Square[]}
   */
  getSquares() {
    let selectedPiece = this.getSelectedPiece();

    let moves = selectedPiece ? this.game.getMoves(selectedPiece) : [];

    return this.game.tiles.map((tile) => {
      let piece = this.game.getPiece(tile);

      let move = moves.find((move) => move.x === tile.x && move.y === tile.y);
      let selected = tile.x === selectedPiece?.x && tile.y === selectedPiece?.y;

      let checker = tile.x % 2 ? tile.y % 2 : (tile.y + 1) % 2;
      /** @type {Color} */
      let color = checker ? white : black;

      return { tile, color, move, selected, piece };
    });
  }

  async newGame() {
    this.game = new Game();
    await setDoc(roomDoc, {
      pieces: this.game.pieces,
      tiles: this.game.tiles,
      selectedPieceId: null,
    });
  }

  async init() {
    let roomSnapshot = await getDoc(roomDoc);

    // If the room doesn't exist yet, then create it.
    if (!roomSnapshot.exists()) {
      this.newGame();
    }

    onSnapshot(roomDoc, (snapshot) => {
      let data = snapshot.data();
      if (data) {
        this.game.tiles = data.tiles;
        this.game.pieces = data.pieces;
        this.selectedPieceId = data.selectedPieceId;
      }
    });
  }

  async sync() {
    updateDoc(roomDoc, {
      tiles: this.game.tiles,
      pieces: this.game.pieces,
      selectedPieceId: null,
    });
  }
}

Object.assign(window, { MultiplayerApp });

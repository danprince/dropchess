import {
  black,
  dropped,
  Game,
  pawn,
  rook,
  knight,
  bishop,
  queen,
  king,
  shaking,
  stable,
  white,
} from "./chess.js";

/**
 * @import { Color, Point, Piece, PieceType, Tile, TileType, Move } from "./chess.js";
 */

/**
 * The shaking character ( ̰) shows that the tile below is shaking.
 */
const shakingRegex = /\u0330/g;
/**
 * The selected character ( ̌) shows that the piece below is selected.
 */
const selectedRegex = /\u030c/g;
/**
 * The targeting character ( ̽ or x) shows that the piece below is targeted.
 */
const targetedRegex = /[\u033dx]/g;
/**
 * Regex for splitting grapheme clusters so that they keep their combining
 * characters.
 */
const graphemeClusterRegex = /.[\u0300-\u036f]*/g;
/**
 * Regex for finding any unicode combining characters.
 */
const combiningCharactersRegex = /[\u0300-\u036f]/g;

/**
 * @type {Record<string, (props: Omit<Piece, "color" | "type">) => Piece>}
 */
const charToPieceTable = {
  "♟": (props) => ({ ...props, color: black, type: pawn }),
  "♜": (props) => ({ ...props, color: black, type: rook }),
  "♞": (props) => ({ ...props, color: black, type: knight }),
  "♝": (props) => ({ ...props, color: black, type: bishop }),
  "♛": (props) => ({ ...props, color: black, type: queen }),
  "♚": (props) => ({ ...props, color: black, type: king }),
  "♙": (props) => ({ ...props, color: white, type: pawn }),
  "♖": (props) => ({ ...props, color: white, type: rook }),
  "♘": (props) => ({ ...props, color: white, type: knight }),
  "♗": (props) => ({ ...props, color: white, type: bishop }),
  "♕": (props) => ({ ...props, color: white, type: queen }),
  "♔": (props) => ({ ...props, color: white, type: king }),
};

/**
 * @type {Record<PieceType, string>}
 */
const whitePieceToCharTable = {
  [pawn]: "♙",
  [rook]: "♖",
  [knight]: "♘",
  [bishop]: "♗",
  [queen]: "♕",
  [king]: "♔",
};

/**
 * @type {Record<PieceType, string>}
 */
const blackPieceToCharTable = {
  [pawn]: "♟",
  [rook]: "♜",
  [knight]: "♞",
  [bishop]: "♝",
  [queen]: "♛",
  [king]: "♚",
};

/**
 * @param {object} square
 * @param {Tile} square.tile
 * @param {Piece | undefined} square.piece
 * @param {Move | undefined} square.move
 * @returns {string}
 */
function renderSquare({ tile, piece, move }) {
  if (tile.type === dropped) {
    return " ";
  }

  if (move) {
    return "x";
  }

  let modifiers = "";

  if (tile.type === "shaking") {
    modifiers += "\u0330";
  }

  if (piece) {
    let char =
      piece.color === white
        ? whitePieceToCharTable[piece.type]
        : blackPieceToCharTable[piece.type];
    return `${char}${modifiers}`;
  }

  return `.${modifiers}`;
}

export class Scenario {
  /**
   * @type {Game}
   */
  game;

  /**
   * @type {Piece}
   */
  selectedPiece;

  /**
   * @type {Point | undefined}
   */
  target;

  /**
   * @type {string}
   */
  template;

  /**
   * @param {string} template
   */
  constructor(template) {
    this.template = template.trim();

    let nextPieceId = 0;

    /** @type {Piece[]} */
    let pieces = [];

    /** @type {Tile[]} */
    let tiles = [];

    /** @type {Piece | undefined} */
    let selectedPiece;

    let lines = this.template.split("\n");

    for (let y = 0; y < lines.length; y++) {
      let graphemes = lines[y].match(graphemeClusterRegex) ?? [];

      for (let x = 0; x < graphemes.length; x++) {
        let grapheme = graphemes[x];
        let char = grapheme.replace(combiningCharactersRegex, "");
        let isShaking = shakingRegex.test(grapheme);
        let isSelected = selectedRegex.test(grapheme);
        let isTargeted = targetedRegex.test(grapheme);

        if (isTargeted) {
          this.target = { x, y };
        }

        /**
         * @type {TileType}
         */
        let type = char === " " ? dropped : isShaking ? shaking : stable;

        tiles.push({ x, y, type: type });

        // If there's a tile character here, there's no piece and we can skip
        // to the next tile.
        if (char === "." || char === " " || char === "x") {
          continue;
        }

        let piece = charToPieceTable[char]({
          id: nextPieceId++,
          x,
          y,
          active: true,
        });
        pieces.push(piece);

        if (isSelected && selectedPiece) {
          throw new Error(`Multiple pieces are selected in this scenario!`);
        }

        if (isSelected) {
          selectedPiece = piece;
        }
      }
    }

    let whitePieces = pieces.filter((piece) => piece.color === white);

    // If there's only one white piece in the scenario, it's automatically the
    // selected piece for the sake of simplicity.
    if (!selectedPiece && whitePieces.length === 1) {
      selectedPiece = whitePieces[0];
    }

    // If there's only one piece in the scenario, then it's automatically the
    // selected piece for the sake of simplicity.
    if (!selectedPiece && pieces.length === 1) {
      selectedPiece = pieces[0];
    }

    if (!selectedPiece) {
      throw new Error(
        `There was no selected piece in the scenario!
${template}

Either:
- Make sure there is only one piece in the scenario
- Or make sure there is only one white piece in the scenario
- Or add the `,
      );
    }

    this.game = new Game({ pieces, tiles });
    this.selectedPiece = selectedPiece;
  }

  simulate() {
    if (this.target === undefined) {
      throw new Error(
        `Can't simulate a scenario that doesn't have a target!\n\n${this.render()}`,
      );
    }

    let { x, y } = this.target;
    let moves = this.game.getMoves(this.selectedPiece);
    let move = moves.find((move) => move.x === x && move.y === y);

    if (move === undefined) {
      throw new Error(`This is not a legal move!\n\n${this.template}`);
    }

    this.game.play(this.selectedPiece, move);

    return this;
  }

  render({ showLegalMoves = false } = {}) {
    let moves = showLegalMoves ? this.game.getMoves(this.selectedPiece) : [];
    let output = "";

    for (let y = 0; y < this.game.rows; y++) {
      for (let x = 0; x < this.game.columns; x++) {
        let tile = this.game.getTileOrThrow({ x, y });
        let piece = this.game.getPiece(tile);

        let move = moves.find((move) => move.x === x && move.y === y);

        output += renderSquare({ tile, piece, move });
      }

      output += "\n";
    }

    return output;
  }
}

/**
 * @param {string} string
 * @param {string} [separator]
 * @returns {string}
 */
function toReadableDiff(string, separator = " ") {
  let strings = string.trim().split("\n\n");
  let output = "";

  let columns = strings.map((string) => string.split("\n"));
  let rows = columns[0].length;

  for (let i = 0; i < rows; i++) {
    let parts = columns.map((column) => column[i]);
    output += parts.join(separator);
    output += "\n";
  }

  return `${output}${string}`;
}

/**
 * @param {string} name
 * @param {() => void} callback
 */
export function test(name, callback) {
  try {
    callback();
    console.log(`✔ ${name}`);
  } catch (err) {
    throw new Error(`⨯ ${name}\n${/** @type {Error} */ (err).message}`);
  }
}

/**
 * @param {string} states
 */
export function expectMoves(states) {
  let [template, expected] = states.trim().split("\n\n");

  let actual = new Scenario(template).render({ showLegalMoves: true });

  actual = actual.trim();
  expected = expected.trim();

  let diff = toReadableDiff(`
Expected
${expected}

Actual
${actual}
`);

  if (actual !== expected) {
    throw new Error(`Actual moves did not match expected moves!\n\n${diff}`);
  }
}

/**
 * @param {string} states
 */
export function expectState(states) {
  let [template, expected] = states.trim().split("\n\n");

  let actual = new Scenario(template)
    .simulate()
    .render({ showLegalMoves: false });

  actual = actual.trim();
  expected = expected.trim();

  let diff = toReadableDiff(`
Starting
${template}

Expected
${expected}

Actual
${actual}
`);

  if (actual !== expected) {
    throw new Error(`Actual state did not match expected state!\n\n${diff}`);
  }
}

/**
 * @param {string} template
 */
export function expectIllegalMove(template) {
  let scenario = new Scenario(template);
  let moves = scenario.game.getMoves(scenario.selectedPiece);

  let move = moves.find(
    (move) => move.x === scenario.target?.x && move.y === scenario.target?.y,
  );

  let diff = toReadableDiff(`
Starting
${template}

Legal moves
${scenario.render({ showLegalMoves: true })}
  `);

  if (move !== undefined) {
    throw new Error(`Expected illegal move\n\n${diff}`);
  }
}

/**
 * @param {Color} winner
 * @param {string} template
 */
export function expectWinner(winner, template) {
  let scenario = new Scenario(template);
  scenario.simulate();

  let diff = toReadableDiff(`
Starting
${template}

Finishing
${scenario.render()}
  `);

  if (scenario.game.winner !== winner) {
    throw new Error(`Expected winner to be ${winner}\n\n${diff}`);
  }
}

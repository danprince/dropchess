/**
 * @typedef {object} Point
 * @prop {number} x
 * @prop {number} y
 *
 * @typedef {typeof white} White
 * @typedef {typeof black} Black
 * @typedef {White | Black} Color
 *
 * @typedef {typeof king} King
 * @typedef {typeof queen} Queen
 * @typedef {typeof bishop} Bishop
 * @typedef {typeof knight} Knight
 * @typedef {typeof rook} Rook
 * @typedef {typeof pawn} Pawn
 * @typedef {King | Queen | Bishop | Knight | Rook | Pawn} PieceType
 *
 * @typedef {typeof move | typeof push} MoveType
 *
 * @typedef {typeof stable | typeof shaking | typeof dropped} DropState
 *
 * @typedef {object} Tile
 * @prop {number} x
 * @prop {number} y
 * @prop {DropState} dropState
 *
 * @typedef {object} Move
 * @prop {MoveType} type
 * @prop {number} x
 * @prop {number} y
 *
 * @typedef {object} Square
 * @prop {Tile} tile
 * @prop {Color} color
 * @prop {Piece | undefined} [piece]
 * @prop {Move | undefined} [move]
 */

/**
 * @typedef {object} Piece
 * @prop {number} id
 * @prop {PieceType} type
 * @prop {Color} color
 * @prop {number} x
 * @prop {number} y
 */

export const rows = 8;
export const columns = 8;

export const black = "black";
export const white = "white";

export const move = "move";
export const push = "push";

export const stable = "stable";
export const shaking = "shaking";
export const dropped = "dropped";

export const king = "king";
export const queen = "queen";
export const bishop = "bishop";
export const knight = "knight";
export const rook = "rook";
export const pawn = "pawn";

export class Game {
  /**
   * @readonly
   */
  rows = rows;

  /**
   * @readonly
   */
  columns = columns;

  /**
   * @type {Color}
   */
  turn = white;

  /**
   * @type {Color | undefined}
   */
  winner;

  /**
   * @type {Tile[]}
   */
  tiles;

  /**
   * @type {Piece[]}
   */
  pieces;

  /**
   * @type {Piece[]}
   */
  activePieces;

  constructor({ tiles = createTiles(), pieces = createStartingPieces() } = {}) {
    this.tiles = tiles;
    this.pieces = pieces;
    this.activePieces = [...pieces];
  }

  /**
   * @param {Point} point
   * @returns {Tile | undefined}
   */
  getTile(point) {
    if (point.x >= 0 && point.y >= 0 && point.x < columns && point.y < rows) {
      return this.tiles[point.x + point.y * columns];
    }
  }

  /**
   * @param {Point} point
   * @returns {Tile}
   */
  getTileOrThrow(point) {
    let tile = this.getTile(point);
    assert(tile, `There is no tile at ${point.x}, ${point.y}!`);
    return tile;
  }

  /**
   * @param {Point} point
   * @returns {Piece | undefined}
   */
  getPiece(point) {
    return this.activePieces.find(
      (piece) => piece.x === point.x && piece.y === point.y,
    );
  }

  /**
   * Check whether it's possible to push a piece.
   * @param {Piece} piece The piece to check.
   * @param {Point} direction The direction vector to push them in.
   * @returns {boolean}
   */
  canPush(piece, direction) {
    let dx = Math.sign(direction.x);
    let dy = Math.sign(direction.y);
    let point = { x: piece.x + dx, y: piece.y + dy };

    let blockingPiece = this.getPiece(point);
    if (blockingPiece) return false;

    return true;
  }

  /**
   * Check whether a certain point is blocked. Either by a dropped tile or by
   * a piece.
   * @param {Point} point
   * @returns {boolean}
   */
  isBlocked(point) {
    let tile = this.getTile(point);
    let piece = this.getPiece(point);
    return (
      tile === undefined || tile.dropState === dropped || piece !== undefined
    );
  }

  /**
   * @param {Piece} piece
   * @param {Move} move
   */
  play(piece, move) {
    if (move.type === "move") {
      this.movePieceToPoint(piece, move);
    } else if (move.type === push) {
      this.pushPieceAtPoint(piece, move);
      this.movePieceToPoint(piece, move);
    }
  }

  /**
   * @param {Piece} piece The piece to move.
   * @param {Point} point The point to move to.
   * @param {boolean} [pushed] Whether this piece was pushed here.
   */
  movePieceToPoint(piece, point, pushed = false) {
    let startTile = this.getTileOrThrow(piece);
    let endTile = this.getTile(point);

    if (startTile.dropState === shaking) {
      startTile.dropState = dropped;
    }

    piece.x = point.x;
    piece.y = point.y;

    if (endTile === undefined || endTile.dropState === dropped) {
      this.removePiece(piece);
      return;
    }

    // Pawns can't knock tiles out and neither can pieces that were pushed
    if (endTile.dropState === stable && piece.type !== pawn && !pushed) {
      endTile.dropState = shaking;
    }

    // Black pawn promotion
    if (piece.type === pawn && piece.color === black && piece.y === rows - 1) {
      piece.type = queen;
    }

    // White pawn promotion
    if (piece.type === pawn && piece.color === white && piece.y === 0) {
      piece.type = queen;
    }
  }

  /**
   * @param {Piece} piece
   */
  removePiece(piece) {
    let index = this.activePieces.indexOf(piece);
    assert(index >= 0, `Trying to remove a piece that is not in the game!`);
    this.activePieces.splice(index, 1);

    if (piece.type === king) {
      this.winner = piece.color === black ? white : black;
    }
  }

  /**
   * @param {Piece} pusher
   * @param {Point} point
   */
  pushPieceAtPoint(pusher, point) {
    let piece = this.getPiece(point);
    assert(piece, `There's nothing to push at ${point.x}, ${point.y}!`);
    let dx = Math.sign(point.x - pusher.x);
    let dy = Math.sign(point.y - pusher.y);
    let pushToPoint = { x: point.x + dx, y: point.y + dy };
    this.movePieceToPoint(piece, pushToPoint, true);
  }

  /**
   * @param {Piece} piece
   * @returns {Move[]}
   */
  getMoves(piece) {
    switch (piece.type) {
      case king:
        return getKingMoves(this, piece);
      case queen:
        return getQueenMoves(this, piece);
      case bishop:
        return getBishopMoves(this, piece);
      case knight:
        return getKnightMoves(this, piece);
      case rook:
        return getRookMoves(this, piece);
      case pawn:
        return getPawnMoves(this, piece);
    }
  }
}

/**
 * @param {any} condition
 * @param {string} message
 * @return {asserts condition}
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @template T
 * @param {T} value
 * @returns {value is NonNullable<T>}
 */
function isNonNull(value) {
  return value != null;
}

/**
 * @template T
 * @param {T[]} array
 * @returns {NonNullable<T>[]}
 */
function shake(array) {
  return array.filter(isNonNull);
}

/**
 * @param {Array<[Color, PieceType] | undefined>} template
 * @returns {Piece[]}
 */
function createPieces(template) {
  assert(
    template.length === columns * rows,
    `Template size was not ${columns}x${rows}`,
  );
  /**
   * @type {Piece[]}
   */
  let pieces = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      let i = x + y * columns;
      let cell = template[i];
      if (cell) {
        let [color, type] = cell;
        let id = pieces.length;
        pieces.push({ id, x, y, type, color });
      }
    }
  }

  return pieces;
}

/**
 * @returns {Tile[]}
 */
function createTiles() {
  /**
   * @type {Tile[]}
   */
  let tiles = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      tiles.push({ x, y, dropState: stable });
    }
  }

  return tiles;
}

function createStartingPieces() {
  // prettier-ignore
  return createPieces([
    [black, rook],
    [black, knight],
    [black, bishop],
    [black, queen],
    [black, king],
    [black, bishop],
    [black, knight],
    [black, rook],
    [black, pawn],
    [black, pawn],
    [black, pawn],
    [black, pawn],
    [black, pawn],
    [black, pawn],
    [black, pawn],
    [black, pawn],
    , , , , , , , ,
    , , , , , , , ,
    , , , , , , , ,
    , , , , , , , ,
    [white, pawn],
    [white, pawn],
    [white, pawn],
    [white, pawn],
    [white, pawn],
    [white, pawn],
    [white, pawn],
    [white, pawn],
    [white, rook],
    [white, knight],
    [white, bishop],
    [white, queen],
    [white, king],
    [white, bishop],
    [white, knight],
    [white, rook],
  ]);
}

/**
 * Extend a ray in one direction on the board until hitting an obstacle.
 * Returns the position of every square visited, including the square with the
 * obstacle.
 * @param {Game} game
 * @param {Point} start
 * @param {Point} direction
 * @returns {Point[]}
 */
function ray(game, start, direction) {
  /**
   * @type {Point[]}
   */
  let points = [];
  let x = start.x;
  let y = start.y;
  let dx = Math.sign(direction.x);
  let dy = Math.sign(direction.y);
  let maxSteps = Math.max(columns, rows);

  for (let i = 0; i < maxSteps; i++) {
    x += dx;
    y += dy;

    let point = { x, y };
    points.push(point);

    if (game.isBlocked(point)) {
      break;
    }
  }

  return points;
}

const eightwayMoveset = [
  { x: -1, y: -1 },
  { x: -0, y: -1 },
  { x: +1, y: -1 },
  { x: -1, y: -0 },
  { x: +1, y: -0 },
  { x: -1, y: +1 },
  { x: -0, y: +1 },
  { x: +1, y: +1 },
];

const straightMoveset = [
  { x: -0, y: -1 },
  { x: -1, y: -0 },
  { x: +1, y: -0 },
  { x: -0, y: +1 },
];

const diagonalMoveset = [
  { x: -1, y: -1 },
  { x: +1, y: -1 },
  { x: -1, y: +1 },
  { x: +1, y: +1 },
];

const knightMoveset = [
  { x: -2, y: -1 },
  { x: -2, y: +1 },
  { x: +2, y: -1 },
  { x: +2, y: +1 },
  { x: -1, y: -2 },
  { x: -1, y: +2 },
  { x: +1, y: -2 },
  { x: +1, y: +2 },
];

/**
 * Find the logical move that a piece would take to move to a specific point.
 * If a move would not be possible, then return undefined instead.
 * @param {Game} game
 * @param {Piece} piece
 * @param {Point} point
 * @return {Move | undefined}
 */
function getLogicalMove(game, piece, point) {
  let tile = game.getTile(point);

  // If the tile is empty or has been dropped then we can't move there.
  if (tile === undefined || tile.dropState === "dropped") {
    return undefined;
  }

  let target = game.getPiece(point);

  // If the square is empty then the logical step is just to move there.
  if (target === undefined) {
    return { type: move, x: point.x, y: point.y };
  }

  // If the piece is the square is the same colour as the moving piece, then we
  // can't move there.
  if (target.color === piece.color) {
    return undefined;
  }

  let direction = {
    x: Math.sign(point.x - piece.x),
    y: Math.sign(point.y - piece.y),
  };

  // Check whether we can push this target piece backwards.
  if (game.canPush(target, direction)) {
    return { type: push, x: point.x, y: point.y };
  }

  // We can't move here.
  return undefined;
}

/**
 * @param {Game} game
 * @param {Piece} piece
 * @returns {Move[]}
 */
function getKingMoves(game, piece) {
  return shake(
    eightwayMoveset.map((direction) => {
      let point = { x: piece.x + direction.x, y: piece.y + direction.y };
      return getLogicalMove(game, piece, point);
    }),
  );
}

/**
 * @param {Game} game
 * @param {Piece} piece
 * @returns {Move[]}
 */
function getQueenMoves(game, piece) {
  return shake(
    eightwayMoveset.flatMap((direction) => {
      return ray(game, piece, direction).map((point) =>
        getLogicalMove(game, piece, point),
      );
    }),
  );
}

/**
 * @param {Game} game
 * @param {Piece} piece
 * @returns {Move[]}
 */
function getBishopMoves(game, piece) {
  return shake(
    diagonalMoveset.flatMap((direction) => {
      return ray(game, piece, direction).map((point) =>
        getLogicalMove(game, piece, point),
      );
    }),
  );
}

/**
 * @param {Game} game
 * @param {Piece} piece
 * @returns {Move[]}
 */
function getKnightMoves(game, piece) {
  return shake(
    knightMoveset.map((direction) => {
      let point = { x: piece.x + direction.x, y: piece.y + direction.y };
      return getLogicalMove(game, piece, point);
    }),
  );
}

/**
 * @param {Game} game
 * @param {Piece} piece
 * @returns {Move[]}
 */
function getRookMoves(game, piece) {
  return shake(
    straightMoveset.flatMap((direction) => {
      return ray(game, piece, direction).map((point) =>
        getLogicalMove(game, piece, point),
      );
    }),
  );
}

/**
 * @param {Game} game
 * @param {Piece} piece
 * @returns {Move[]}
 */
function getPawnMoves(game, piece) {
  let isStartingRow = piece.y === (piece.color === white ? rows - 2 : 1);
  let step = piece.color === white ? -1 : 1;

  let single = { x: piece.x, y: piece.y + step };
  let double = { x: piece.x, y: piece.y + step * 2 };
  let leftDiagonal = { x: piece.x - 1, y: piece.y + step };
  let rightDiagonal = { x: piece.x + 1, y: piece.y + step };

  let singleMove = getLogicalMove(game, piece, single);
  let doubleMove = getLogicalMove(game, piece, double);
  let leftDiagonalMove = getLogicalMove(game, piece, leftDiagonal);
  let rightDiagonalMove = getLogicalMove(game, piece, rightDiagonal);

  return shake([
    singleMove?.type === move ? singleMove : undefined,

    // Pawns can only double move if they're on their starting row
    isStartingRow &&
    // And their single move isn't blocked
    singleMove?.type === move &&
    // And their double move isn't blocked
    doubleMove?.type === move
      ? doubleMove
      : undefined,

    leftDiagonalMove?.type === push ? leftDiagonalMove : undefined,
    rightDiagonalMove?.type === push ? rightDiagonalMove : undefined,
  ]);
}

# Dropchess

[Chess][chess] meets [Dropshot][dropshot].

When a _non-pawn_ piece moves, the tile they land on will _shake_. If a piece moves off of a shaking tile, then the tile will drop out of the board entirely, leaving a hole.

Anything that would be a legal capture in chess will push the piece backwards instead (so long as there is space). If a piece is pushed down a hole or off of the board, it is removed from the game.

There's no [check][check], no [castling][castling], and no [en passant][enpassant].

You win by pushing the opponent's king off of the board.

![Dec-22-2024 17-07-40](https://github.com/user-attachments/assets/6b6d9681-8d04-4183-937c-8d24e1dce08c)

## Play

The game is hosted [here](https://danprince.github.io/dropchess/) but there's no CPU opponent, so you'll have to play against yourself, or play couch co-op style.

There's also a free-for-all multiplayer version [here](https://danprince.github.io/dropchess/multiplayer.html) but I don't guarantee that this will stay online. Add something like `#woopdeedoo` to the URL if you want to play in a dedicated room.

[chess]: https://en.wikipedia.org/wiki/Chess
[dropshot]: https://rocketleague.fandom.com/wiki/Dropshot
[check]: https://en.wikipedia.org/wiki/Check_(chess)
[castling]: https://en.wikipedia.org/wiki/Castling
[enpassant]: https://en.wikipedia.org/wiki/En_passant

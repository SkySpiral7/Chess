//my definitions: http://skyspiral7.blogspot.com/2015/04/chess-notation.html
/*PGN definitions (I think they are all the same):
original (links): https://web.archive.org/web/20100528142843/http://www.very-best.de/pgn-spec.htm
nice links but more than pgn: http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm
less but still plain txt: http://www6.chessclub.com/help/PGN-spec
plain txt: http://www.opensource.apple.com/source/Chess/Chess-109.0.3/Documentation/PGN-Standard.txt
very plain txt: http://www.tim-mann.org/Standard
wikip: http://en.wikipedia.org/wiki/Portable_Game_Notation
*/

function Board()
{
    var boardArray =
   [  //this rotation makes coordinate translation easier but doesn't match FEN
      ['R', 'P', '1', '1', '1', '1', 'p', 'r'],  //A1 is [0][0]
      ['N', 'P', '1', '1', '1', '1', 'p', 'n'],  //B
      ['B', 'P', '1', '1', '1', '1', 'p', 'b'],  //C
      ['Q', 'P', '1', '1', '1', '1', 'p', 'q'],  //D
      ['K', 'P', '1', '1', '1', '1', 'p', 'k'],  //E
      ['B', 'P', '1', '1', '1', '1', 'p', 'b'],  //F
      ['N', 'P', '1', '1', '1', '1', 'p', 'n'],  //G
      ['R', 'P', '1', '1', '1', '1', 'p', 'r']   //H8 is [7][7]
   ];
    this.getBoardArray = function(){return boardArray;};
   this.move = function(source, destination)
   {
       var result = this.getPiece(source);
       this.setPiece(source, '1');  //make source empty
       this.setPiece(destination, result);
   };
   this.setPiece = function(coord, symbol)
   {
       var indexies = this.coordToIndex(coord);
       boardArray[indexies[0]][indexies[1]] = symbol;
   };
   this.getPiece = function(coord)
   {
       var indexies = this.coordToIndex(coord);
       return boardArray[indexies[0]][indexies[1]];
   };
   this.coordToIndex = function(coord)
   {
       var indexies = [0, 0];
       coord = coord.toUpperCase();
       indexies[0] = coord.charCodeAt(0);
       indexies[0] -= 'A'.charCodeAt(0);  //adjust to 0
       indexies[1] = Number.parseInt(coord[1]);
       indexies[1]--;  //adjust to 0
       return indexies;
   };
}

function parseMinimumCoordinateNotation(text)
{
    //eg: e1e2
    var board = new Board();
    board.move(text.substr(0, 2), text.substr(2, 2));
    if(text.length === 5) board.setPiece(text.substr(2, 2), text[4]);
    return JSON.stringify(board.getBoardArray());
    // /^[A-H][1-8][A-H][1-8][QBNR]?$/i
}

function parseFriendlyCoordinateNotation(text)
{
//Ra1-a8xQ, Pa7-B8xR=q or Pa7-A8=N, Pa5-b6en, KC, QC, Ra1-a8+#
// /^(?:[KQ]C|P[A-H][1-8]-[A-H][1-8](?:EN|(?:X[QBNRP])?(?:=[QBNR])?)|[KQBNR][A-H][1-8]-[A-H][1-8](?:X[QBNRP])?)\+?#?$/i
}

function parseShortenedFen(text)
{
   //rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR
   // /^(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb] (?:-|K?Q?k?q?)(?: [a-hA-H][1-8])?)?(?: (?:\+#|\+|#))?$/
}

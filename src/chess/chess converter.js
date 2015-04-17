//my definitions: http://skyspiral7.blogspot.com/2015/04/chess-notation.html
/*PGN definitions (I think they are all the same):
original (links): https://web.archive.org/web/20100528142843/http://www.very-best.de/pgn-spec.htm
nice links but more than pgn: http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm
less but still plain txt: http://www6.chessclub.com/help/PGN-spec
plain txt: http://www.opensource.apple.com/source/Chess/Chess-109.0.3/Documentation/PGN-Standard.txt
very plain txt: http://www.tim-mann.org/Standard
wikip: http://en.wikipedia.org/wiki/Portable_Game_Notation
*/

function coordToIndex(coord)
{
    var indexies = [0, 0];
    coord = coord.toUpperCase();
    indexies[0] = coord.charCodeAt(0);
    indexies[0] -= 'A'.charCodeAt(0);  //adjust to 0
    indexies[1] = Number.parseInt(coord[1]);
    indexies[1]--;  //adjust to 0
    return indexies;
}
function indexToCoord(fileIndex, rankIndex)
{
    var coord;
    coord = String.fromCharCode(fileIndex + ('A'.charCodeAt(0)));  //adjust from 0
    coord += (rankIndex + 1);
    return coord;
}

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
   this.copy = function()
   {
       var result = new Board();
       result.boardArray = boardArray.slice();  //copy array
       return result;
   };
   this.move = function(source, destination)
   {
       var result = this.getPiece(source);
       this.setPiece(source, '1');  //make source empty
       this.setPiece(destination, result);
   };
   this.setPiece = function(coord, symbol)
   {
       var indexies = coordToIndex(coord);
       this.setPieceIndex(indexies[0], indexies[1], symbol);
   };
   this.setPieceIndex = function(fileIndex, rankIndex, symbol)
   {
       boardArray[fileIndex][rankIndex] = symbol;
   };
   this.getPiece = function(coord)
   {
       var indexies = coordToIndex(coord);
       return this.getPieceIndex(indexies[0], indexies[1]);
   };
   this.getPieceIndex = function(fileIndex, rankIndex)
   {
       return boardArray[fileIndex][rankIndex];
   };
}

function parseMinimumCoordinateNotationGame(text)
{
}

function parseMinimumCoordinateNotationMove(text)
{
    //eg: e1e2
    var board = new Board();
    board.move(text.substr(0, 2), text.substr(2, 2));
    if(text.length === 5) board.setPiece(text.substr(2, 2), text[4]);
    return JSON.stringify(board.getBoardArray());
    // /^[A-H][1-8][A-H][1-8][QBNR]?$/i
}

function parseFriendlyCoordinateNotationGame(text)
{
}

function parseFriendlyCoordinateNotationMove(text)
{
//Ra1-a8xQ, Pa7-B8xR=q or Pa7-A8=N, Pa5-b6en, KC, QC, Ra1-a8+#
// /^(?:[KQ]C|P[A-H][1-8]-[A-H][1-8](?:EN|(?:X[QBNRP])?(?:=[QBNR])?)|[KQBNR][A-H][1-8]-[A-H][1-8](?:X[QBNRP])?)\+?#?$/i
}

function parseShortenedFenGame(text)
{
}

/**This only the piece locations and the information that follows.*/
function parseShortenedFenRow(text)
{
   //rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq a2 +#
}

/**This only parses the piece locations.*/
function parseFenBoard(text)
{
   //rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR
    var board = new Board();
    var rankArray = text.split('/');
   for (var rankIndex = 0; rankIndex < rankArray.length; rankIndex++)
   {
       var fileString = rankArray[rankIndex];
       fileString = fileString.replace('8', '11111111');
       fileString = fileString.replace('7', '1111111');
       fileString = fileString.replace('6', '111111');
       fileString = fileString.replace('5', '11111');
       fileString = fileString.replace('4', '1111');
       fileString = fileString.replace('3', '111');
       fileString = fileString.replace('2', '11');
       //although not very clean I thought it was better than: if(/[2-8]/) loop: board.setPieceIndex(fileIndex, rankIndex, '1');
      for (var fileIndex = 0; fileIndex < fileString.length; fileIndex++)
      {
          board.setPieceIndex(fileIndex, rankIndex, fileString[fileIndex]);
      }
   }
    return JSON.stringify(board.getBoardArray());
   // /^(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb] (?:-|K?Q?k?q?)(?: [a-hA-H][1-8])?)?(?: (?:\+#|\+|#))?$/
}

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
    coord += (rankIndex + 1);  //adjust from 0
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
    // /^[A-H][1-8][A-H][1-8][QBNR]?$/i
    return parseMinimumCoordinateNotationMove(new Board(), text);
}

function parseMinimumCoordinateNotationMove(board, text)
{
    //eg: a7a8q
    board.move(text.substr(0, 2), text.substr(2, 2));
    if(text.length === 5) board.setPiece(text.substr(2, 2), text[4]);
    return JSON.stringify(board.getBoardArray());
}

function parseFriendlyCoordinateNotationGame(text)
{
    // /^(?:[KQ]C|P[A-H][1-8]-[A-H][1-8](?:EN|(?:X[QBNRP])?(?:=[QBNR])?)|[KQBNR][A-H][1-8]-[A-H][1-8](?:X[QBNRP])?)\+?#?$/i
    return parseFriendlyCoordinateNotationMove(new Board(), text, true);
}

function parseFriendlyCoordinateNotationMove(board, text, isWhitesTurn)
{
    //eg: Ra1-a8xQ, Pa7-B8xR=q or Pa7-A8=N, Pa5-b6en, KC, QC, Ra1-a8+#
    text = text.toLowerCase();
   if (isWhitesTurn)
   {
       //TODO: castling is not yet implemented by Board
       if(text === 'kc') return parseMinimumCoordinateNotationMove(board, 'e1g1');
       if(text === 'qc') return parseMinimumCoordinateNotationMove(board, 'e1c1');
   }
    //if black's turn
    if(text === 'kc') return parseMinimumCoordinateNotationMove(board, 'e8g8');
    if(text === 'qc') return parseMinimumCoordinateNotationMove(board, 'e8c8');

    text = text.substring(1);  //remove piece symbol
    text = text.replace(/x./, '');  //remove capture information
    text = text.replace('en', '');  //ditto
    text = text.replace(/[+#=-]/, '');  //remove check/end game indicators and human friendly padding
    return parseMinimumCoordinateNotationMove(board, text);
}

function parseShortenedFenGame(text)
{
   // /^(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb] (?:-|K?Q?k?q?)(?: [a-hA-H][1-8])?)?(?: (?:\+#|\+|#))?$/
   return parseShortenedFenRow(new Board(), text);
}

/**This only the piece locations and the information that follows.*/
function parseShortenedFenRow(board, text)
{
   //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq a2 +#
   return parseFenBoard(board, text);
}

/**This only parses the piece locations.*/
function parseFenBoard(board, text)
{
   //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR
    var rankArray = text.split('/');
   for (var rankIndex = 0; rankIndex < rankArray.length; rankIndex++)
   {
       var fileString = rankArray[rankIndex];
       fileString = fileString.replace('2', '11');
       fileString = fileString.replace('3', '111');
       fileString = fileString.replace('4', '1111');
       fileString = fileString.replace('5', '11111');
       fileString = fileString.replace('6', '111111');
       fileString = fileString.replace('7', '1111111');
       fileString = fileString.replace('8', '11111111');
       //although not very clean I thought it was better than: if(/[2-8]/) loop: board.setPieceIndex(fileIndex, rankIndex, '1');
      for (var fileIndex = 0; fileIndex < fileString.length; fileIndex++)
      {
          board.setPieceIndex(fileIndex, rankIndex, fileString[fileIndex]);
      }
   }
    return JSON.stringify(board.getBoardArray());
}

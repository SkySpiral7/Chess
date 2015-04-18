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

function Game()
{
    var boardArray = [new Board()];  //game starts with only initial starting positions
    //var isWhitesTurn = ((boardArray.length&1)===1);  //if odd
    //var fullMoveCount = Math.floor((boardArray.length-1)/2);
   this.getBoard = function(index)
   {
       if(index === undefined) index = boardArray.length - 1;  //last index
       return boardArray[index];
   };
   this.move = function(source, destination)
   {
       //copy and change the last (current) board
       var result = this.getBoard().copy();
       result.move(source, destination);
       boardArray.push(result);
   };
}

function Board()
{
    var boardSquares =
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
    //programmer readable variables to track board state
    var white = {canKingsCastle: true, canQueensCastle: true};
    var black = {canKingsCastle: true, canQueensCastle: true};

    this.getBoardSquares = function(){return boardSquares;};
   this.copy = function()
   {
       var result = new Board();
       result.boardSquares = boardSquares.slice();  //copy array
       result.white = {canKingsCastle: white.canKingsCastle, canQueensCastle: white.canQueensCastle};
       result.black = {canKingsCastle: black.canKingsCastle, canQueensCastle: black.canQueensCastle};
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
       boardSquares[fileIndex][rankIndex] = symbol;
   };
   this.getPiece = function(coord)
   {
       var indexies = coordToIndex(coord);
       return this.getPieceIndex(indexies[0], indexies[1]);
   };
   this.getPieceIndex = function(fileIndex, rankIndex)
   {
       return boardSquares[fileIndex][rankIndex];
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
    return JSON.stringify(board.getBoardSquares());
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
    text = text.replace(/[+#=-]/g, '');  //remove check/end game indicators and human friendly padding
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
    //this order is logical and most efficient due to slowest string growth rate
    text = text.replace(/2/g, '11');
    text = text.replace(/3/g, '111');
    text = text.replace(/4/g, '1111');
    text = text.replace(/5/g, '11111');
    text = text.replace(/6/g, '111111');
    text = text.replace(/7/g, '1111111');
    text = text.replace(/8/g, '11111111');
    //although not very clean this is better than string manipulation
    //I also thought it was better than doing inside the loop: if(/[2-8]/) loop: board.setPieceIndex(fileIndex, rankIndex, '1');
    var rankArray = text.split('/');
    rankArray.reverse();  //FEN starts with rank 8 instead of 1
   for (var rankIndex = 0; rankIndex < rankArray.length; rankIndex++)
   {
      for (var fileIndex = 0; fileIndex < rankArray[rankIndex].length; fileIndex++)
      {
          board.setPieceIndex(fileIndex, rankIndex, rankArray[rankIndex][fileIndex]);
      }
   }
    return JSON.stringify(board.getBoardSquares());
}

function writeFenBoard(board)
{
    var boardSquares = board.getBoardSquares();
    var fenSquares = [[], [], [], [], [], [], [], []];  //8 empty arrays
    var fileIndex, rankIndex;
   for (fileIndex = 0; fileIndex < boardSquares.length; fileIndex++)
   {
       //yes I know the board is always 8x8
      for (rankIndex = 0; rankIndex < boardSquares[fileIndex].length; rankIndex++)
      {
          fenSquares[rankIndex].push(boardSquares[fileIndex][rankIndex]);
      }
   }
    fenSquares.reverse();  //FEN starts with rank 8 instead of 1
   fenSquares.forEach(function(element, index, array)
   {
       array[index] = element.join('');  //flatten 2d into 1d
   });
    var result = fenSquares.join('/');  //then join to string. I can't use .join('').join('/') because join converts 2d to string
    //must be in this order to prevent pppppppp/2222/ etc
    result = result.replace(/11111111/g, '8');
    result = result.replace(/1111111/g, '7');
    result = result.replace(/111111/g, '6');
    result = result.replace(/11111/g, '5');
    result = result.replace(/1111/g, '4');
    result = result.replace(/111/g, '3');
    result = result.replace(/11/g, '2');
    return result;
}

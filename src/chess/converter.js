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

/**Returns an array of every coordinate that is difference between the 2 boards.*/
function findBoardDifferences(beforeBoard, afterBoard)
{
    var beforeSquares = beforeBoard.getBoardSquares();
    var afterSquares = afterBoard.getBoardSquares();
    var differences = [];  //length will be 2 or 4 for valid moves
   for (var fileIndex = 0; fileIndex < beforeSquares.length; fileIndex++)
   {
      for (var rankIndex = 0; rankIndex < beforeSquares[fileIndex].length; rankIndex++)
      {
          if(beforeSquares[fileIndex][rankIndex] !== afterSquares[fileIndex][rankIndex]) differences.push(indexToCoord(fileIndex, rankIndex));
      }
   }
    return differences;
}
/**Returns the move that caused the beforeBoard to become the afterBoard.
Returns strings KC or QC for castling. Or returns an object with the properties source, destination, and promotedTo.
The first are coordinates and the last being the piece symbol (or undefined).*/
function findBoardMove(beforeBoard, afterBoard)
{
    var differences = findBoardDifferences(beforeBoard, afterBoard);
   if (differences.length === 4)  //castling occurred.
   {
       //all castling will involve one of the 4 corners which can be used to determine which side it was
       //note that the coordinates returned are all upper case
       if(differences.indexOf('A1') !== -1 || differences.indexOf('A8') !== -1) return 'QC';
       //if(differences.indexOf('H1') !== -1 || differences.indexOf('H8') !== -1)  //no need to check since this is the only other one
       return 'KC';
   }
   else  //length is 2
   {
       var source = differences[0], destination = differences[1];  //guess the order
       if(afterBoard.getPiece(destination) === '1'){source = destination; destination = differences[0];}  //correct if wrong
          //if the after location is empty then the piece was moved from that spot
      if (beforeBoard.getPiece(source).toLowerCase() === 'p' && afterBoard.getPiece(destination).toLowerCase() !== 'p')
          //if was pawn but now isn't then promotion occurred
      {
          return {source: source, destination: destination, promotedTo: afterBoard.getPiece(destination)};
      }
       return {source: source, destination: destination};
   }
}

var Parse = {};
Parse.MinimumCoordinateNotationGame = function(text)
{
    // /^[A-H][1-8][A-H][1-8][QBNR]?$/i
    var game = new Game();
    game.addBoard(Parse.MinimumCoordinateNotationMove(game.getBoard(), text));
    //TODO: method stubs
    return JSON.stringify(game.getBoard().getBoardSquares());
}

Parse.MinimumCoordinateNotationMove = function(board, text)
{
    //eg: a7a8q
    board = board.copy();
    var destination = text.substr(2, 2);
    board.move(text.substr(0, 2), destination);
   if (text.length === 5)
   {
       var symbol = text[4];
       if(board.isWhitesTurn()) symbol = symbol.toUpperCase();
       else symbol = symbol.toLowerCase();
       board.setPiece(destination, symbol);  //the symbol for setPiece is case sensitive
   }
    board.switchTurns();
    return board;
}

Parse.FriendlyCoordinateNotationGame = function(text)
{
    // /^(?:[KQ]C|P[A-H][1-8]-[A-H][1-8](?:EN|(?:X[QBNRP])?(?:=[QBNR])?)|[KQBNR][A-H][1-8]-[A-H][1-8](?:X[QBNRP])?)\+?#?$/i
    var game = new Game();
    game.addBoard(Parse.FriendlyCoordinateNotationMove(game.getBoard(), text));
    //method stub
    return JSON.stringify(game.getBoard().getBoardSquares());
}

Parse.FriendlyCoordinateNotationMove = function(board, text)
{
    //eg: Ra1-a8xQ, Pa7-B8xR=q or Pa7-A8=N, Pa5-b6en, KC, QC, Ra1-a8+#
    //this function doesn't copy board because it always delegates the movement to Parse.MinimumCoordinateNotationMove
    text = text.toLowerCase();
   if (board.isWhitesTurn())
   {
       if(text === 'kc') return Parse.MinimumCoordinateNotationMove(board, 'e1g1');
       if(text === 'qc') return Parse.MinimumCoordinateNotationMove(board, 'e1c1');
   }
   else  //if black's turn
   {
       if(text === 'kc') return Parse.MinimumCoordinateNotationMove(board, 'e8g8');
       if(text === 'qc') return Parse.MinimumCoordinateNotationMove(board, 'e8c8');
   }

    text = text.substring(1);  //remove piece symbol
    text = text.replace(/x./, '');  //remove capture information
    text = text.replace('en', '');  //ditto
    text = text.replace(/[+#=-]/g, '');  //remove check/end game indicators and human friendly padding
    return Parse.MinimumCoordinateNotationMove(board, text);
}

Parse.ShortenedFenGame = function(text)
{
   // /^(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb] (?:-|K?Q?k?q?)(?: [a-hA-H][1-8])?)?(?: (?:\+#|\+|#))?$/
    var game = new Game();
    game.addBoard(Parse.ShortenedFenRow(game.getBoard(), text));
    //method stub
    return JSON.stringify(game.getBoard().getBoardSquares());
}

/**This parses the piece locations and the information that follows.*/
Parse.ShortenedFenRow = function(board, text)
{
   //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq a2 +#
    //method stub
   return Parse.FenBoard(board, text);
}

/**This only parses the piece locations.*/
Parse.FenBoard = function(board, text)
{
   //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR
    board = board.copy();
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
    board.switchTurns();  //TODO: Parse.FenBoard only needs to know whose turn it is
    return board;  //TODO: Parse.FenBoard doesn't call board.move therefore the board state isn't updated
}

/**The string returned has piece locations and the information that follows.*/
var Write = {};
Write.FenRow = function(board, fullMoveCount)
{
    var state = board.getState();
    var result = writeFenBoard(board) + ' ';

    if(board.isWhitesTurn()) result += 'w ';
    else result += 'b ';

    var castleAbilityString = '';
    if(state.white.canKingsCastle) castleAbilityString += 'K';
    if(state.white.canQueensCastle) castleAbilityString += 'Q';
    if(state.black.canKingsCastle) castleAbilityString += 'k';
    if(state.black.canQueensCastle) castleAbilityString += 'q';
    if(castleAbilityString === '') castleAbilityString = '-';
    result += castleAbilityString + ' ';

    //TODO: board doesn't yet implement state.halfMoveCount
    result += state.enPassantSquare + ' 0 ' + fullMoveCount;

    return result;
}

/**The string returned is only the piece locations.*/
Write.FenBoard = function(board)
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

Write.FriendlyCoordinateNotationMove = function(beforeBoard, afterBoard)
{
    var move = findBoardMove(beforeBoard, afterBoard);
    if(typeof(move) === 'string') return move.toUpperCase();  //KC or QC

    var result = beforeBoard.getPiece(move.source);  //start with piece symbol
    result += move.source + '-' + move.destination;

    var capturedPiece = afterBoard.getState().capturedPiece;
   if (capturedPiece !== '1')
   {
       if(beforeBoard.getState().enPassantSquare === move.destination) result += 'en';
          //the enPassantSquare is always empty therefore the only way for a capture to occur by moving there is via en passant
          //enPassantSquare defaults to '-' if it doesn't apply which won't match any possible destination coordinate
       else result += 'x' + capturedPiece;
   }

    if(move.promotedTo !== undefined) result += '=' + move.promotedTo;
    //TODO: doesn't detect +#
    return result.toUpperCase();
}

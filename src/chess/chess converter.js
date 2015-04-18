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
    var boardArray = [new Board(true)];  //game starts with only initial starting positions
    //var isWhitesTurn = ((boardArray.length&1)===1);  //if odd
    //var fullMoveCount = Math.floor((boardArray.length-1)/2);
   this.getBoard = function(index)
   {
       if(index === undefined) index = boardArray.length - 1;  //last index
       return boardArray[index];
   };
    this.addBoard = function(board){boardArray.push(board);};
   this.move = function(source, destination)
   {
       //copy and change the last (current) board
       var result = this.getBoard().copy();
       result.move(source, destination);
       result.switchTurns();
       this.addBoard(result);
   };
}

function Board(passedTurnIndicator)
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
    /**Not that if true then white will be calling this.move*/
    var isWhitesTurn = passedTurnIndicator;

    this.getBoardSquares = function(){return boardSquares;};
   this.copy = function()
   {
       var result = new Board(isWhitesTurn);
       result.setAll({boardSquares: boardSquares, white: white, black: black});  //pass in each private var
       return result;
   };
   this.setAll = function(allValues)
   {
      for (var fileIndex = 0; fileIndex < allValues.boardSquares.length; fileIndex++)
      {
          boardSquares[fileIndex] = allValues.boardSquares[fileIndex].slice();  //shallow array copy
      }
       white = {canKingsCastle: allValues.white.canKingsCastle, canQueensCastle: allValues.white.canQueensCastle};
       black = {canKingsCastle: allValues.black.canKingsCastle, canQueensCastle: allValues.black.canQueensCastle};
   };
    this.isWhitesTurn = function(){return isWhitesTurn;};
    this.switchTurns = function(){isWhitesTurn = !isWhitesTurn;};
   this.move = function(source, destination)
   {
       //doesn't perform any move validation
       if(this.isKingCastling(source, destination)) this.performKingsCastle();
       else if(this.isQueenCastling(source, destination)) this.performQueensCastle();
      else
      {
          var pieceMoved = this.getPiece(source);
          this.simpleMove(source, destination);
          //castling ability will be set to false redundantly and that's ok
          if(pieceMoved === 'K') white = {canKingsCastle: false, canQueensCastle: false};
          else if(pieceMoved === 'k') black = {canKingsCastle: false, canQueensCastle: false};
          else if(pieceMoved === 'R' && source === 'a1') white.canQueensCastle = false;
          else if(pieceMoved === 'R' && source === 'h1') white.canKingsCastle = false;
          else if(pieceMoved === 'r' && source === 'a8') black.canQueensCastle = false;
          else if(pieceMoved === 'r' && source === 'h8') black.canKingsCastle = false;
      }
   };
   this.simpleMove = function(source, destination)
   {
       //doesn't perform any move validation
       var result = this.getPiece(source);
       this.setPiece(source, '1');  //make source empty
       this.setPiece(destination, result);
   };
   this.isKingCastling = function(source, destination)
   {
       var symbol = this.getPiece(source);
       //assume that isWhitesTurn matches the color of the king
       //doesn't perform any other move validation
       if(symbol === 'K' && destination === 'g1') return white.canKingsCastle;
       if(symbol === 'k' && destination === 'g8') return black.canKingsCastle;
       return false;
   };
   this.isQueenCastling = function(source, destination)
   {
       var symbol = this.getPiece(source);
       //assume that isWhitesTurn matches the color of the king
       //doesn't perform any other move validation
       if(symbol === 'K' && destination === 'c1') return white.canQueensCastle;
       if(symbol === 'k' && destination === 'c8') return black.canQueensCastle;
       return false;
   };
   this.performKingsCastle = function()
   {
      if (isWhitesTurn)
      {
          white = {canKingsCastle: false, canQueensCastle: false};
          this.simpleMove('h1', 'f1');  //moves the rook
          this.simpleMove('e1', 'g1');  //moves the king
      }
      else
      {
          black = {canKingsCastle: false, canQueensCastle: false};
          this.simpleMove('h8', 'f8');  //moves the rook
          this.simpleMove('e8', 'g8');  //moves the king
      }
   };
   this.performQueensCastle = function()
   {
      if (isWhitesTurn)
      {
          white = {canKingsCastle: false, canQueensCastle: false};
          this.simpleMove('a1', 'd1');  //moves the rook
          this.simpleMove('e1', 'c1');  //moves the king
      }
      else
      {
          black = {canKingsCastle: false, canQueensCastle: false};
          this.simpleMove('a8', 'd8');  //moves the rook
          this.simpleMove('e8', 'c8');  //moves the king
      }
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
    var game = new Game();
    game.addBoard(parseMinimumCoordinateNotationMove(game.getBoard(), text));
    return JSON.stringify(game.getBoard().getBoardSquares());
}

function parseMinimumCoordinateNotationMove(board, text)
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

function parseFriendlyCoordinateNotationGame(text)
{
    // /^(?:[KQ]C|P[A-H][1-8]-[A-H][1-8](?:EN|(?:X[QBNRP])?(?:=[QBNR])?)|[KQBNR][A-H][1-8]-[A-H][1-8](?:X[QBNRP])?)\+?#?$/i
    var game = new Game();
    game.addBoard(parseFriendlyCoordinateNotationMove(game.getBoard(), text));
    return JSON.stringify(game.getBoard().getBoardSquares());
}

function parseFriendlyCoordinateNotationMove(board, text)
{
    //eg: Ra1-a8xQ, Pa7-B8xR=q or Pa7-A8=N, Pa5-b6en, KC, QC, Ra1-a8+#
    text = text.toLowerCase();
   if (board.isWhitesTurn())
   {
       if(text === 'kc') return parseMinimumCoordinateNotationMove(board, 'e1g1');
       if(text === 'qc') return parseMinimumCoordinateNotationMove(board, 'e1c1');
   }
   else  //if black's turn
   {
       if(text === 'kc') return parseMinimumCoordinateNotationMove(board, 'e8g8');
       if(text === 'qc') return parseMinimumCoordinateNotationMove(board, 'e8c8');
   }

    text = text.substring(1);  //remove piece symbol
    text = text.replace(/x./, '');  //remove capture information
    text = text.replace('en', '');  //ditto
    text = text.replace(/[+#=-]/g, '');  //remove check/end game indicators and human friendly padding
    return parseMinimumCoordinateNotationMove(board, text);
}

function parseShortenedFenGame(text)
{
   // /^(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb] (?:-|K?Q?k?q?)(?: [a-hA-H][1-8])?)?(?: (?:\+#|\+|#))?$/
    var game = new Game();
    game.addBoard(parseShortenedFenRow(game.getBoard(), text));
    return JSON.stringify(game.getBoard().getBoardSquares());
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
    board.switchTurns();
    return board;
}

/**The string returned is only the piece locations.*/
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

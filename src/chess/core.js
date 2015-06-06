function Game()
{
    var boardArray = [new Board(true)];  //game starts with only initial starting positions
    //var isWhitesTurn = ((boardArray.length & 1) === 1);  //if odd
    //var fullMoveCount = Math.floor((boardArray.length - 1) / 2);
    //all state info is stored in board so that it can change each move
    this.getBoardArray = function(){return boardArray;};
   this.getBoard = function(index)
   {
       if(index === undefined) index = boardArray.length - 1;  //last index
       else if(index < 0) index += boardArray.length;  //from end
       return boardArray[index];
   };
    this.addBoard = function(board){boardArray.push(board);};
   this.move = function(source, destination, promotedTo)
   {
       //copy and change the last (current) board
       var result = this.getBoard().copy();
       result.move(source, destination, promotedTo);
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
    var enPassantSquare = '-';
    /**The piece symbol that was captured by the last move.
    Will be '1' if nothing was captured and 'EN' if it was an en passant.*/
    var capturedPiece = '1';

    this.getState = function(){return {white: white, black: black, isWhitesTurn: isWhitesTurn, enPassantSquare: enPassantSquare, capturedPiece: capturedPiece};};
    this.getBoardSquares = function(){return boardSquares;};
   this.copy = function()
   {
       var result = new Board(isWhitesTurn);  //passing in isWhitesTurn is in this case redundant
       result.setAll(boardSquares, this.getState());  //indirectly pass in each private var
       return result;
   };
   this.changeState = function(stateChange)
   {
       var newState = this.getState();  //default to current state
      for (var state in stateChange)
      {
          if(stateChange.hasOwnProperty(state) && typeof(stateChange[state]) !== 'object') newState[state] = stateChange[state];
          //don't shallow copy white/black because it would delete k/q if not passed in
      }
       //manually copy white and black
      if (stateChange.white !== undefined)
      {
          if(stateChange.white.canKingsCastle !== undefined) newState.white.canKingsCastle = stateChange.white.canKingsCastle;
          if(stateChange.white.canQueensCastle !== undefined) newState.white.canQueensCastle = stateChange.white.canQueensCastle;
      }
      if (stateChange.black !== undefined)
      {
          if(stateChange.black.canKingsCastle !== undefined) newState.black.canKingsCastle = stateChange.black.canKingsCastle;
          if(stateChange.black.canQueensCastle !== undefined) newState.black.canQueensCastle = stateChange.black.canQueensCastle;
      }
       this.setAll(boardSquares, newState);
   };
   this.setAll = function(newBoardSquares, newState)
   {
      for (var fileIndex = 0; fileIndex < newBoardSquares.length; fileIndex++)
      {
          boardSquares[fileIndex] = newBoardSquares[fileIndex].slice();  //shallow array copy
      }
       white = {canKingsCastle: newState.white.canKingsCastle, canQueensCastle: newState.white.canQueensCastle};
       black = {canKingsCastle: newState.black.canKingsCastle, canQueensCastle: newState.black.canQueensCastle};
       isWhitesTurn = newState.isWhitesTurn;
       enPassantSquare = newState.enPassantSquare;
       capturedPiece = newState.capturedPiece;
   };
    this.isWhitesTurn = function(){return isWhitesTurn;};
    this.switchTurns = function(){isWhitesTurn = !isWhitesTurn;};
   this.move = function(source, destination, promotedTo)
   {
       var pieceMoved = this.getPiece(source);

       //perform some simple move validation
       if(pieceMoved === '1') this.error('Empty square ' + source + ' can\'t be moved. destination=' + destination);
       if(isWhitesTurn && (/^[rnbqkp]$/).test(pieceMoved)) this.error('White can\'t move black\'s piece. coordinates: ' + source + destination);
       if(!isWhitesTurn && (/^[RNBQKP]$/).test(pieceMoved)) this.error('Black can\'t move white\'s piece. coordinates: ' + source + destination);
       if(pieceMoved.toUpperCase() !== 'P' && promotedTo !== undefined) this.error('Piece ' + pieceMoved + ' can\'t be promoted to ' + promotedTo + '. coordinates: ' + source + destination);

       //done below errors so that the error message will have same case. ok since the error checking doesn't need them
       source = source.toLowerCase();
       destination = destination.toLowerCase();

       if(this.isKingCastling(source, destination)) this.performKingsCastle();
       else if(this.isQueenCastling(source, destination)) this.performQueensCastle();
       else if(this.isEnPassantOccurring(source, destination)) this.performEnPassant(source);
      else
      {
          enPassantSquare = '-';
          capturedPiece = this.getPiece(destination);

          this.simpleMove(source, destination);
          this.castlingAbilityLoss(pieceMoved, source);
          if(pieceMoved === 'p' || pieceMoved === 'P') this.handlePawnMove(source, destination, promotedTo);
      }
   };
   this.simpleMove = function(source, destination)
   {
       //doesn't perform any move validation
       var result = this.getPiece(source);
       this.setPiece(source, '1');  //make source empty
       this.setPiece(destination, result);
   };
   this.castlingAbilityLoss = function(pieceMoved, source)
   {
       //castling ability will be set to false redundantly and that's ok
       if(pieceMoved === 'K') white = {canKingsCastle: false, canQueensCastle: false};
       else if(pieceMoved === 'k') black = {canKingsCastle: false, canQueensCastle: false};
       else if(pieceMoved === 'R' && source === 'a1') white.canQueensCastle = false;
       else if(pieceMoved === 'R' && source === 'h1') white.canKingsCastle = false;
       else if(pieceMoved === 'r' && source === 'a8') black.canQueensCastle = false;
       else if(pieceMoved === 'r' && source === 'h8') black.canKingsCastle = false;
   };
   this.handlePawnMove = function(source, destination, promotedTo)
   {
       var moveDifference = Math.abs(coordToIndex(source)[1] - coordToIndex(destination)[1]);
      if (moveDifference === 2)  //double move occurred
      {
          if(isWhitesTurn) enPassantSquare = source[0] + '3';
          else enPassantSquare = source[0] + '6';
      }
      else if (promotedTo !== undefined)
      {
         if (isWhitesTurn)
         {
             if(destination[1] !== '8') this.error('P' + destination + ' can\'t be promoted to ' + promotedTo + '. source=' + source);
             this.setPiece(destination, promotedTo.toUpperCase());
         }
         else
         {
             if(destination[1] !== '1') this.error('p' + destination + ' can\'t be promoted to ' + promotedTo + '. source=' + source);
             this.setPiece(destination, promotedTo.toLowerCase());
         }
      }
   };
   this.isEnPassantOccurring = function(source, destination)
   {
       var symbol = this.getPiece(source);
       return (symbol.toUpperCase() === 'P' && destination === enPassantSquare);
   };
   this.isKingCastling = function(source, destination)
   {
       var symbol = this.getPiece(source);
       //assume that isWhitesTurn matches the color of the king
       if(symbol === 'K' && (source + destination) === 'e1g1') return white.canKingsCastle;
       if(symbol === 'k' && (source + destination) === 'e8g8') return black.canKingsCastle;
       return false;
   };
   this.isQueenCastling = function(source, destination)
   {
       var symbol = this.getPiece(source);
       //assume that isWhitesTurn matches the color of the king
       if(symbol === 'K' && (source + destination) === 'e1c1') return white.canQueensCastle;
       if(symbol === 'k' && (source + destination) === 'e8c8') return black.canQueensCastle;
       return false;
   };
   this.performEnPassant = function(source)
   {
       if(enPassantSquare === '-') this.error('An en passant can\'t be performed. source=' + source);
       var destination = enPassantSquare;
       enPassantSquare = '-';
       capturedPiece = 'EN';
       this.simpleMove(source, destination);

       var deadPawnSquare;
       if(isWhitesTurn) deadPawnSquare = destination[0] + '4';
       else deadPawnSquare = destination[0] + '5';

       this.setPiece(deadPawnSquare, '1');
   };
   this.performKingsCastle = function()
   {
       enPassantSquare = '-';
       capturedPiece = '1';
      if (isWhitesTurn)
      {
          if(!white.canKingsCastle) this.error('White can\'t perform a King\'s castle.');
          white = {canKingsCastle: false, canQueensCastle: false};
          this.simpleMove('h1', 'f1');  //moves the rook
          this.simpleMove('e1', 'g1');  //moves the king
      }
      else
      {
          if(!black.canKingsCastle) this.error('Black can\'t perform a King\'s castle.');
          black = {canKingsCastle: false, canQueensCastle: false};
          this.simpleMove('h8', 'f8');  //moves the rook
          this.simpleMove('e8', 'g8');  //moves the king
      }
   };
   this.performQueensCastle = function()
   {
       enPassantSquare = '-';
       capturedPiece = '1';
      if (isWhitesTurn)
      {
          if(!white.canQueensCastle) this.error('White can\'t perform a Queen\'s castle.');
          white = {canKingsCastle: false, canQueensCastle: false};
          this.simpleMove('a1', 'd1');  //moves the rook
          this.simpleMove('e1', 'c1');  //moves the king
      }
      else
      {
          if(!black.canQueensCastle) this.error('Black can\'t perform a Queen\'s castle.');
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
   this.error = function(message)
   {
       var boardString = 'board:\n' + this.toString();
       console.log(boardString);
       throw new Error(message);
   };
   this.toString = function()
   {
       return JSON.stringify(boardSquares).replace(/\],/g, '],\n');
   };
}

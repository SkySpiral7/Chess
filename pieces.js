function getAllPieces(board, isWhitesTurn)
{
    var pieces = [];
    var boardSquares = board.getBoardSquares();
   for (var fileIndex = 0; fileIndex < boardSquares.length; fileIndex++)
   {
      for (var rankIndex = 0; rankIndex < boardSquares[fileIndex].length; rankIndex++)
      {
          var symbol = boardSquares[fileIndex][rankIndex];
          if(symbol !== '1' && isWhitesTurn === isPieceWhite(symbol))
             pieces.push(symbolToPiece(indexToCoord(fileIndex, rankIndex), board));
      }
   }
    return pieces;
    function isPieceWhite(symbol){return (symbol === symbol.toUpperCase());};
}

function symbolToPiece(source, board)
{
    source = source.toUpperCase();
    var originalSymbol = board.getPiece(source);
    var symbol = originalSymbol.toUpperCase();
    var isWhite = (symbol === originalSymbol);
   switch (symbol)
   {
       case 'R': return new Rook(source, isWhite, board);
       case 'N': return new Knight(source, isWhite, board);
       case 'B': return new Bishop(source, isWhite, board);
       case 'Q': return new Queen(source, isWhite, board);
       case 'K': return new King(source, isWhite, board);
       case 'P': return new Pawn(source, isWhite, board);
   }
    board.error(source + ' is empty');
}
/*
Interface for the pieces.
javascript can't have real interfaces because it would compile anyway.
/**All pieces are immutable. Therefore the piece can't be moved after creation.*
function Piece(source, isWhite)
{
    /**Array of destinations that can be moved to and might contain: 'KC', 'QC', 'EN'.
    Doesn't account for check otherwise only legal moves are returned.*
    this.getAllMoves = function(){return ['G2', 'KC'];};
    /**Doesn't account for check otherwise returns true if this piece can legally move to the destination.*
    this.isMoveLegal = function(destination){return (this.getAllMoves().indexOf(destination.toUpperCase()) !== -1);};
    this.toString = function(){return 'Black King on A5';};
    this.getSource = function(){return source;};
    this.isWhite = function(){return isWhite;};

    if(isWhite) this.getSymbol = function(){return 'P';};
    else this.getSymbol = function(){return 'p';};
}
*/
function Rook(source, isWhite, board)
{
    source = source.toUpperCase();
    this.getSource = function(){return source;};
    this.isWhite = function(){return isWhite;};

    var allMoves;
   this.getAllMoves = function()
   {
      if (allMoves == null)
      {
          allMoves = [];
          allMoves = allMoves.concat(movementType.cardinal(source, isWhite, board));

          //castling:
          //the source is checked so that only the correct rook will return KC/QC
          if(isWhite && source === 'H1' && board.getState().white.canKingsCastle &&
             areAllSquaresEmpty(board, ['F1', 'G1'])) allMoves.push('KC');
          else if(!isWhite && source === 'H8' && board.getState().black.canKingsCastle &&
             areAllSquaresEmpty(board, ['F8', 'G8'])) allMoves.push('KC');

          else if(isWhite && source === 'A1' && board.getState().white.canQueensCastle &&
             areAllSquaresEmpty(board, ['B1', 'C1', 'D1'])) allMoves.push('QC');
          else if(!isWhite && source === 'H1' && board.getState().black.canQueensCastle &&
             areAllSquaresEmpty(board, ['B8', 'C8', 'D8'])) allMoves.push('QC');
      }
       return allMoves;
   };
    this.isMoveLegal = function(destination){return (this.getAllMoves().indexOf(destination.toUpperCase()) !== -1);};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Rook on ' + source;
    this.toString = function(){return name;};

    if(isWhite) this.getSymbol = function(){return 'R';};
    else this.getSymbol = function(){return 'r';};
}
function Knight(source, isWhite, board)
{
    source = source.toUpperCase();
    this.getSource = function(){return source;};
    this.isWhite = function(){return isWhite;};

    var allMoves;
   this.getAllMoves = function()
   {
      if (allMoves == null)
      {
          allMoves = [];
          var indexies = coordToIndex(source);

         //2 up (white's perspective)
         if (indexies.rankIndex <= 5)
         {
             if(source[0] !== 'A') allMoves.push(indexToCoord(indexies.fileIndex - 1, indexies.rankIndex + 2));
             if(source[0] !== 'H') allMoves.push(indexToCoord(indexies.fileIndex + 1, indexies.rankIndex + 2));
         }
         //2 right (white's perspective)
         if (indexies.fileIndex <= 5)
         {
             if(source[1] !== '1') allMoves.push(indexToCoord(indexies.fileIndex + 2, indexies.rankIndex - 1));
             if(source[1] !== '8') allMoves.push(indexToCoord(indexies.fileIndex + 2, indexies.rankIndex + 1));
         }
         //2 down (white's perspective)
         if (indexies.rankIndex >= 2)
         {
             if(source[0] !== 'A') allMoves.push(indexToCoord(indexies.fileIndex - 1, indexies.rankIndex - 2));
             if(source[0] !== 'H') allMoves.push(indexToCoord(indexies.fileIndex + 1, indexies.rankIndex - 2));
         }
         //2 left (white's perspective)
         if (indexies.fileIndex >= 2)
         {
             if(source[1] !== '1') allMoves.push(indexToCoord(indexies.fileIndex - 2, indexies.rankIndex - 1));
             if(source[1] !== '8') allMoves.push(indexToCoord(indexies.fileIndex - 2, indexies.rankIndex + 1));
         }
          allMoves = filterFriendlyFire(board, allMoves, isWhite);
      }
       return allMoves;
   };
    this.isMoveLegal = function(destination){return (this.getAllMoves().indexOf(destination.toUpperCase()) !== -1);};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Knight on ' + source;
    this.toString = function(){return name;};

    if(isWhite) this.getSymbol = function(){return 'N';};
    else this.getSymbol = function(){return 'n';};
}
function Bishop(source, isWhite, board)
{
    this.getSource = function(){return source;};
    this.isWhite = function(){return isWhite;};

    var allMoves;
   this.getAllMoves = function()
   {
       if(allMoves == null) allMoves = movementType.diagonal(source, isWhite, board);
       return allMoves;
   };
    this.isMoveLegal = function(destination){return (this.getAllMoves().indexOf(destination.toUpperCase()) !== -1);};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Bishop on ' + source;
    this.toString = function(){return name;};

    if(isWhite) this.getSymbol = function(){return 'B';};
    else this.getSymbol = function(){return 'b';};
}
function Queen(source, isWhite, board)
{
    this.getSource = function(){return source;};
    this.isWhite = function(){return isWhite;};

    var allMoves;
   this.getAllMoves = function()
   {
      if (allMoves == null)
      {
          allMoves = [];
          allMoves = allMoves.concat(movementType.diagonal(source, isWhite, board));
          allMoves = allMoves.concat(movementType.cardinal(source, isWhite, board));
      }
       return allMoves;
   };
    this.isMoveLegal = function(destination){return (this.getAllMoves().indexOf(destination.toUpperCase()) !== -1);};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Queen on ' + source;
    this.toString = function(){return name;};

    if(isWhite) this.getSymbol = function(){return 'Q';};
    else this.getSymbol = function(){return 'q';};
}
function King(source, isWhite, board)
{
    source = source.toUpperCase();
    this.getSource = function(){return source;};
    this.isWhite = function(){return isWhite;};

    var allMoves;
   this.getAllMoves = function()
   {
      if (allMoves == null)
      {
          allMoves = [];
          var indexies = coordToIndex(source);

          //cardinal moves:
          if(source[0] !== 'A') allMoves.push(indexToCoord(indexies.fileIndex - 1, indexies.rankIndex));
          if(source[0] !== 'H') allMoves.push(indexToCoord(indexies.fileIndex + 1, indexies.rankIndex));
          if(source[1] !== '1') allMoves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex - 1));
          if(source[1] !== '8') allMoves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex + 1));

          //diagonal moves:
          if(source[0] !== 'A' && source[1] !== '1') allMoves.push(indexToCoord(indexies.fileIndex - 1, indexies.rankIndex - 1));
          if(source[0] !== 'A' && source[1] !== '8') allMoves.push(indexToCoord(indexies.fileIndex - 1, indexies.rankIndex + 1));
          if(source[0] !== 'H' && source[1] !== '1') allMoves.push(indexToCoord(indexies.fileIndex + 1, indexies.rankIndex - 1));
          if(source[0] !== 'H' && source[1] !== '8') allMoves.push(indexToCoord(indexies.fileIndex + 1, indexies.rankIndex + 1));

          allMoves = filterFriendlyFire(board, allMoves, isWhite);

          //castling:
          if(isWhite && board.getState().white.canKingsCastle) allMoves.push('KC');
          else if(!isWhite && board.getState().black.canKingsCastle) allMoves.push('KC');
          if(isWhite && board.getState().white.canQueensCastle) allMoves.push('QC');
          else if(!isWhite && board.getState().black.canQueensCastle) allMoves.push('QC');
      }
       return allMoves;
   };
    this.isMoveLegal = function(destination){return (this.getAllMoves().indexOf(destination.toUpperCase()) !== -1);};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'King on ' + source;
    this.toString = function(){return name;};

    if(isWhite) this.getSymbol = function(){return 'K';};
    else this.getSymbol = function(){return 'k';};
}
function Pawn(source, isWhite, board)
{
    source = source.toUpperCase();
    this.getSource = function(){return source;};
    this.isWhite = function(){return isWhite;};

    var allMoves;
   this.getAllMoves = function()
   {
      if (allMoves == null)
      {
          allMoves = [];
          //don't need to check the edge of the board: (isWhite && source[1] === '8') and (!isWhite && source[1] === '1')
          //because promotion is required
          var indexies = coordToIndex(source);

          //normal move:
          var normalMoveRank;
          if(isWhite) normalMoveRank = indexies.rankIndex + 1;
          else normalMoveRank = indexies.rankIndex - 1;
          if(board.getPieceByIndex(indexies.fileIndex, normalMoveRank) === '1')
             allMoves.push(indexToCoord(indexies.fileIndex, normalMoveRank));

         //double move:
         if (isWhite && source[1] === '2')
         {
             if(board.getPieceByIndex(indexies.fileIndex, indexies.rankIndex + 1) === '1'
                && board.getPieceByIndex(indexies.fileIndex, indexies.rankIndex + 2) === '1')
                allMoves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex + 2));
         }
         else if (!isWhite && source[1] === '7')
         {
             if(board.getPieceByIndex(indexies.fileIndex, indexies.rankIndex - 1) === '1'
                && board.getPieceByIndex(indexies.fileIndex, indexies.rankIndex - 2) === '1')
                allMoves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex - 2));
         }

         //normal capture:
         if (source[0] !== 'A' && board.getPieceByIndex(indexies.fileIndex - 1, normalMoveRank) !== '1')
         {
             var attackTarget = board.getPieceByIndex(indexies.fileIndex - 1, normalMoveRank);
             var isTargetWhite = (attackTarget === attackTarget.toUpperCase());
             //if not the same color then capture is possible
             if(isWhite !== isTargetWhite) allMoves.push(indexToCoord(indexies.fileIndex - 1, normalMoveRank));
         }
         if (source[0] !== 'H' && board.getPieceByIndex(indexies.fileIndex + 1, normalMoveRank) !== '1')
         {
             var attackTarget = board.getPieceByIndex(indexies.fileIndex + 1, normalMoveRank);
             var isTargetWhite = (attackTarget === attackTarget.toUpperCase());
             //if not the same color then capture is possible
             if(isWhite !== isTargetWhite) allMoves.push(indexToCoord(indexies.fileIndex + 1, normalMoveRank));
         }

          //en passant:
          if(source[0] !== 'A' && indexToCoord(indexies.fileIndex - 1, normalMoveRank) === board.getState().enPassantSquare)
             allMoves.push('EN');
          else if(source[0] !== 'H' && indexToCoord(indexies.fileIndex + 1, normalMoveRank) === board.getState().enPassantSquare)
             allMoves.push('EN');
      }
       return allMoves;
   };
    this.isMoveLegal = function(destination){return (this.getAllMoves().indexOf(destination.toUpperCase()) !== -1);};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Pawn on ' + source;
    this.toString = function(){return name;};

    if(isWhite) this.getSymbol = function(){return 'P';};
    else this.getSymbol = function(){return 'p';};
}

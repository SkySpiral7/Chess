function symbolToPiece(originalSymbol, source, board)
{
    source = source.toUpperCase();
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
    throw new Error('Invalid symbol: ' + originalSymbol);
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
    this.toString = function(){return 'Black King on A5'};
    if(isWhite) this.symbol = 'P';
    else this.symbol = 'p';
}
*/
function Rook(source, isWhite, board)
{
    source = source.toUpperCase();
    var allMoves;
   this.getAllMoves = function()
   {
      if (allMoves == null)
      {
          allMoves = [];
          allMoves = allMoves.concat(movementType.cardinal(source, isWhite, board));

          //castling:
          //the source is checked so that only the correct rook will return QC etc
          if(isWhite && source === 'H1' && board.getState().white.canKingsCastle) allMoves.push('KC');
          else if(!isWhite && source === 'H8' && board.getState().black.canKingsCastle) allMoves.push('KC');
          else if(isWhite && source === 'A1' && board.getState().white.canQueensCastle) allMoves.push('QC');
          else if(!isWhite && source === 'H1' && board.getState().black.canQueensCastle) allMoves.push('QC');
      }
       return allMoves;
   };

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Rook on ' + source;
    this.toString = function(){return name;};

    this.symbol = 'R';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function Knight(source, isWhite, board)
{
    source = source.toUpperCase();
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

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Knight on ' + source;
    this.toString = function(){return name;};

    this.symbol = 'N';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function Bishop(source, isWhite, board)
{
    var allMoves;
   this.getAllMoves = function()
   {
       if(allMoves == null) allMoves = movementType.diagonal(source, isWhite, board);
       return allMoves;
   };

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Bishop on ' + source;
    this.toString = function(){return name;};

    this.symbol = 'B';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function Queen(source, isWhite, board)
{
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

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Queen on ' + source;
    this.toString = function(){return name;};

    this.symbol = 'Q';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function King(source, isWhite, board)
{
    source = source.toUpperCase();
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

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'King on ' + source;
    this.toString = function(){return name;};

    this.symbol = 'K';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function Pawn(source, isWhite, board)
{
    source = source.toUpperCase();
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

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Pawn on ' + source;
    this.toString = function(){return name;};

    this.symbol = 'P';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}

var movementType = {};
movementType.diagonal = function(source, isWhite, board)
{
    var diagonalMoves = [];
    diagonalMoves = diagonalMoves.concat(perpetuateMove(source, 1, 1, isWhite, board));
    diagonalMoves = diagonalMoves.concat(perpetuateMove(source, 1, -1, isWhite, board));
    diagonalMoves = diagonalMoves.concat(perpetuateMove(source, -1, 1, isWhite, board));
    diagonalMoves = diagonalMoves.concat(perpetuateMove(source, -1, -1, isWhite, board));
    return diagonalMoves;
}
movementType.cardinal = function(source, isWhite, board)
{
    var cardinalMoves = [];
    cardinalMoves = cardinalMoves.concat(perpetuateMove(source, 1, 0, isWhite, board));
    cardinalMoves = cardinalMoves.concat(perpetuateMove(source, -1, 0, isWhite, board));
    cardinalMoves = cardinalMoves.concat(perpetuateMove(source, 0, 1, isWhite, board));
    cardinalMoves = cardinalMoves.concat(perpetuateMove(source, 0, -1, isWhite, board));
    return cardinalMoves;
}

/**Returns an array of moves in the direction indicated (source excluded).
Eg: ('a1', 1, 1) => ['b2', 'c3', ..., 'h8'];
Eg: ('a1', -1, 0) => [];*/
function perpetuateMove(source, fileMovement, rankMovement, isWhite, board)
{
    var moves = [];
    var indexies = coordToIndex(source);

    //initial move to exclude source (and so checking empty squares can work):
    indexies.fileIndex += fileMovement;
    indexies.rankIndex += rankMovement;
   while (isOnBoard(indexies.fileIndex) && isOnBoard(indexies.rankIndex)
       && board.getPieceByIndex(indexies.fileIndex, indexies.rankIndex) === '1')
       //stop when we reach the edge of the board or a non-empty square
   {
       moves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex));
       indexies.fileIndex += fileMovement;
       indexies.rankIndex += rankMovement;
   }
    //if stopped because of non-empty square, check to see if it can be captured
   if (isOnBoard(indexies.fileIndex) && isOnBoard(indexies.rankIndex))
   {
       var attackTarget = board.getPieceByIndex(indexies.fileIndex, indexies.rankIndex);
       var isTargetWhite = (attackTarget === attackTarget.toUpperCase());
       //if not the same color then capture is possible
       if(isWhite !== isTargetWhite) moves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex));
   }
    return moves;
    function isOnBoard(index){return (index >= 0 && index <= 7);};
}

/**Given an array of possible moves and color, this function returns an array of moves that don't capture your own color.*/
function filterFriendlyFire(board, destinations, isWhite)
{
    var newMoves = [];
   for (var i = 0; i < destinations.length; i++)
   {
       var symbol = board.getPiece(destinations[i]);
       //if the destination is empty or contains an enemy piece then it is valid
       if(symbol === '1' || isPieceWhite(symbol) !== isWhite) newMoves.push(destinations[i]);
   }
    return newMoves;
    function isPieceWhite(symbol){return (symbol === symbol.toUpperCase());};
}

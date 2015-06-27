function symbolToPiece(originalSymbol, source, board)
{
    source = source.toUpperCase();
    var symbol = originalSymbol.toUpperCase();
    var isWhite = (symbol === originalSymbol);
   switch (symbol)
   {
       case 'R': return new Rook(source, isWhite, board);
       case 'N': return new Knight(source, isWhite);
       case 'B': return new Bishop(source, isWhite);
       case 'Q': return new Queen(source, isWhite);
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
    /**Excludes destinations that are not on the board. Includes illegal moves such as capturing your own king.*
    this.getAllMoves = function(){return ['b7', 'g3'];};
    this.toString = function(){return 'Black King on A5'};
    if(isWhite) this.symbol = 'P';
    else this.symbol = 'p';
}
*/
function Rook(source, isWhite, board)
{
    var allMoves;
   this.getAllMoves = function()
   {
      if (allMoves == null)
      {
          allMoves = [];
          //TODO: check board for castling
          allMoves = allMoves.concat(movementType.cardinal(source));
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
function Knight(source, isWhite)
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
function Bishop(source, isWhite)
{
    var allMoves;
   this.getAllMoves = function()
   {
       if(allMoves == null) allMoves = movementType.diagonal(source);
       return allMoves;
   };

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Bishop on ' + source;
    this.toString = function(){return name;};

    this.symbol = 'B';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function Queen(source, isWhite)
{
    var allMoves;
   this.getAllMoves = function()
   {
      if (allMoves == null)
      {
          allMoves = [];
          allMoves = allMoves.concat(movementType.diagonal(source));
          allMoves = allMoves.concat(movementType.cardinal(source));
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
          //TODO: check board for castling
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
    var allMoves;
   this.getAllMoves = function()
   {
      if (allMoves == null)
      {
          //TODO: check board for en passant and capture
          allMoves = [];
          //don't need to check the edge of the board: (isWhite && source[1] === '8') and (!isWhite && source[1] === '1')
          //because promotion is required
          var indexies = coordToIndex(source);

          //normal move:
          if(isWhite) allMoves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex + 1));
          else allMoves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex - 1));

          //double move:
          if(isWhite && source[1] === '2') allMoves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex + 2));
          else if(!isWhite && source[1] === '7') allMoves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex - 2));
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
movementType.diagonal = function(source)
{
    var diagonalMoves = [];
    diagonalMoves = diagonalMoves.concat(perpetuateMove(source, 1, 1));
    diagonalMoves = diagonalMoves.concat(perpetuateMove(source, 1, -1));
    diagonalMoves = diagonalMoves.concat(perpetuateMove(source, -1, 1));
    diagonalMoves = diagonalMoves.concat(perpetuateMove(source, -1, -1));
    return diagonalMoves;
}
movementType.cardinal = function(source)
{
    var cardinalMoves = [];
    cardinalMoves = cardinalMoves.concat(perpetuateMove(source, 1, 0));
    cardinalMoves = cardinalMoves.concat(perpetuateMove(source, -1, 0));
    cardinalMoves = cardinalMoves.concat(perpetuateMove(source, 0, 1));
    cardinalMoves = cardinalMoves.concat(perpetuateMove(source, 0, -1));
    return cardinalMoves;
}

/**Returns an array of moves in the direction indicated (source excluded).
Eg: ('a1', 1, 1) => ['b2', 'c3', ..., 'h8'];
Eg: ('a1', -1, 0) => [];*/
function perpetuateMove(source, fileMovement, rankMovement)
{
    var moves = [];
    var indexies = coordToIndex(source);
   while (isOnBoard(indexies.fileIndex) && isOnBoard(indexies.rankIndex))
   {
       moves.push(indexToCoord(indexies.fileIndex, indexies.rankIndex));
       indexies.fileIndex += fileMovement;
       indexies.rankIndex += rankMovement;
   }
    moves.shift();  //remove source from results
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

function symbolToPiece(originalSymbol, source, board)
{
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
       //TODO: check board for castling
      if (allMoves == null)
      {
          allMoves = [];
          allMoves = allMoves.concat(perpetuateMove(source, 1, 0));
          allMoves = allMoves.concat(perpetuateMove(source, -1, 0));
          allMoves = allMoves.concat(perpetuateMove(source, 0, -1));
          allMoves = allMoves.concat(perpetuateMove(source, 0, 1));
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
    this.getAllMoves = function(){return [];};

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
      if (allMoves == null)
      {
          allMoves = [];
          allMoves = allMoves.concat(perpetuateMove(source, 1, 1));
          allMoves = allMoves.concat(perpetuateMove(source, -1, -1));
          allMoves = allMoves.concat(perpetuateMove(source, 1, -1));
          allMoves = allMoves.concat(perpetuateMove(source, -1, 1));
      }
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
          //diagonal moves
          allMoves = allMoves.concat(perpetuateMove(source, 1, 1));
          allMoves = allMoves.concat(perpetuateMove(source, -1, -1));
          allMoves = allMoves.concat(perpetuateMove(source, 1, -1));
          allMoves = allMoves.concat(perpetuateMove(source, -1, 1));

          //cardinal moves
          allMoves = allMoves.concat(perpetuateMove(source, 1, 0));
          allMoves = allMoves.concat(perpetuateMove(source, -1, 0));
          allMoves = allMoves.concat(perpetuateMove(source, 0, -1));
          allMoves = allMoves.concat(perpetuateMove(source, 0, 1));
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
    this.getAllMoves = function(){return [];};  //check board for castling

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'King on ' + source;
    this.toString = function(){return name;};

    this.symbol = 'K';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function Pawn(source, isWhite, board)
{
    this.getAllMoves = function(){return [];};  //check board for en passant and capture

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Pawn on ' + source;
    this.toString = function(){return name;};

    this.symbol = 'P';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}

/**Returns an array of moves in the direction indicated (source excluded).
Eg: ('a1', 1, 1) => ['b2', 'c3', ..., 'h8'];
Eg: ('a1', -1, 0) => [];*/
function perpetuateMove(source, fileMovement, rankMovement)
{
    var moves = [];
    var sourceIndexies = coordToIndex(source);
    var fileIndex = sourceIndexies[0], rankIndex = sourceIndexies[1];
   while (isOnBoard(fileIndex) && isOnBoard(rankIndex))
   {
       moves.push(indexToCoord(fileIndex, rankIndex));
       fileIndex += fileMovement;
       rankIndex += rankMovement;
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

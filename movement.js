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

function isKingInCheck(board, isWhitesTurn)
{
    var kingSource = findKing(board, isWhitesTurn);
    var allPieces = getAllPieces(board, !isWhitesTurn);

   for (var i = 0; i < allPieces.length; i++)
   {
       var allMoves = allPieces[i].getAllMoves();
       //don't need to filter out KC, QC, EN because they don't cause check
       if(allMoves.indexOf(kingSource) !== -1) return true;
   }
    return false;
}

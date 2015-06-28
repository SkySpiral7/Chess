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

function areSquaresInCheck(board, sourceArray, isWhitesTurn)
{
    var allPieces = getAllPieces(board, !isWhitesTurn);

   for (var pieceIndex = 0; pieceIndex < allPieces.length; pieceIndex++)
   {
       var allMoves = allPieces[pieceIndex].getAllMoves();
       //don't need to filter out KC, QC, EN because they don't cause check
      for (var sourceIndex = 0; sourceIndex < sourceArray.length; sourceIndex++)
      {
          if(allMoves.indexOf(sourceArray[sourceIndex].toUpperCase()) !== -1) return true;
      }
   }
    return false;
}
function isKingInCheck(board, isWhitesTurn)
{
    return areSquaresInCheck(board, [findKing(board, isWhitesTurn)], isWhitesTurn);
}
function isKingsCastleLegal(board, isWhitesTurn)
{
    if(isWhitesTurn && !board.getState().white.canKingsCastle) return false;
    else if(isWhitesTurn) return !areSquaresInCheck(board, ['E1', 'F1', 'G1', 'H1'], isWhitesTurn);

    //else is black's turn
    if(!board.getState().black.canKingsCastle) return false;
    return !areSquaresInCheck(board, ['E8', 'F8', 'G8', 'H8'], isWhitesTurn);
}
function isQueensCastleLegal(board, isWhitesTurn)
{
    if(isWhitesTurn && !board.getState().white.canQueensCastle) return false;
    else if(isWhitesTurn) return !areSquaresInCheck(board, ['A1', 'B1', 'C1', 'D1', 'E1'], isWhitesTurn);

    //else is black's turn
    if(!board.getState().black.canQueensCastle) return false;
    return !areSquaresInCheck(board, ['A8', 'B8', 'C8', 'D8', 'E8'], isWhitesTurn);
}

function getAllLegalMoves(board, isWhitesTurn)
{
    var allLegalMoves = [];
    var allPieces = getAllPieces(board, isWhitesTurn);
   for (var pieceIndex = 0; pieceIndex < allPieces.length; pieceIndex++)
   {
       var allMoves = allPieces[pieceIndex].getAllMoves();
      for (var moveIndex = 0; moveIndex < allMoves.length; moveIndex++)
      {
          var result = board.copy();
          var source = allPieces[pieceIndex].getSource();

         switch (allMoves[moveIndex])
         {
             case 'EN': result.performEnPassant(source); break;
             case 'KC': result.performKingsCastle(); break;
             case 'QC': result.performQueensCastle(); break;
            default:
                var destination = allMoves[moveIndex];
                var promotedTo;
                if(allPieces[pieceIndex] instanceof Pawn && (destination[1] === '1' || destination[1] === '8')) promotedTo = 'Q';
                   //the symbol of promotedTo is not related to move legality
                //else promotedTo = undefined;

                result.move(source, destination, promotedTo);
             break;
         }
          if(!isKingInCheck(result, isWhitesTurn)) allLegalMoves.push(allMoves[moveIndex]);
      }
   }
    return allLegalMoves;
}

//TODO: consider having pieces.getAllMoves return these. But would only be used by getAllLegalMoves
//also this should at least have a toString.
function Move(target, source, destination, promotedTo)
{
    if(source === 'KC') return function(){target.performKingsCastle();};
    if(source === 'QC') return function(){target.performQueensCastle();};
    if(destination === 'EN') return function(){target.performEnPassant(source);};
    return function(){target.move(source, destination, promotedTo);};
}

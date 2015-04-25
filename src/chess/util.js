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
    var differences = [];  //length will be 2, 3, or 4 for valid moves (simple, en passant, castling)
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
Returns strings KC or QC for castling. Or returns an object with the properties: source, destination, promotedTo, and enPassantOccurred.
The first 2 are coordinates. promotedTo is the piece symbol (or undefined) and enPassantOccurred is true or undefined.*/
function findBoardMove(beforeBoard, afterBoard)
{
    var differences = findBoardDifferences(beforeBoard, afterBoard);
   if (differences.length === 4)  //castling occurred
   {
       //all castling will involve one of the 4 corners which can be used to determine which side it was
       //note that the coordinates returned are all upper case
       if(differences.indexOf('A1') !== -1 || differences.indexOf('A8') !== -1) return 'QC';
       //if(differences.indexOf('H1') !== -1 || differences.indexOf('H8') !== -1)  //no need to check since this is the only other one
       return 'KC';
   }
   else if (differences.length === 3)  //en passant occurred
   {
       var destination = beforeBoard.getState().enPassantSquare;
       differences.splice(differences.indexOf(destination), 1);  //remove destination from the array

       var deadPawnSquare;
       if(isWhitesTurn) deadPawnSquare = destination[0] + '4';
       else deadPawnSquare = destination[0] + '5';

       differences.splice(differences.indexOf(deadPawnSquare), 1);  //remove deadPawnSquare from the array
       var source = differences[0];  //source is the only element left

       return {source: source, destination: destination, enPassantOccurred: true};
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
/**Resets the state of the afterPositions*/
function resetState(beforeBoard, afterPositions)
{
    var move = findBoardMove(beforeBoard, afterPositions);  //get move required to go from beforeBoard to afterPositions
    var afterBoard = beforeBoard.copy();  //copy beforeBoard because I need to change it
    afterBoard.switchTurns();

    //have the afterBoard do that move
    if(move === 'KC') afterBoard.performKingsCastle();
    else if(move === 'QC') afterBoard.performQueensCastle();
    else if(move.enPassantOccurred) afterBoard.performEnPassant(move.source);
    else afterBoard.move(move.source, move.destination, move.promotedTo);  //promotedTo might be undefined

    //now afterBoard has the same positions as afterPositions
    //but because the movement functions were used the state will be correct
    //therefore correct the state of afterPositions
    afterPositions.changeState(afterBoard.getState());
}

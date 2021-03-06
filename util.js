function coordToIndex(coord)
{
    coord = coord.toUpperCase();
    if(!(/^[A-H][1-8]$/).test(coord)) throw new Error('expected coordinates, got: ' + coord);

    var fileIndex = coord.charCodeAt(0);
    fileIndex -= 'A'.charCodeAt(0);  //adjust to 0

    var rankIndex = Number.parseInt(coord[1]);
    rankIndex--;  //adjust to 0

    return {fileIndex: fileIndex, rankIndex: rankIndex};
}
function indexToCoord(fileIndex, rankIndex)
{
    if(!(/^[0-7][0-7]$/).test(''+fileIndex+rankIndex)) throw new Error('illegal indexies: [' + fileIndex + '][' + rankIndex + ']');
    var coord = String.fromCharCode(fileIndex + ('A'.charCodeAt(0)));  //adjust from 0
    coord += (rankIndex + 1);  //adjust from 0
    return coord;
}

function findKing(board, isWhitesTurn)
{
    var symbol = 'K';
    if(!isWhitesTurn) symbol = 'k';
    var boardSquares = board.getBoardSquares();
   for (var fileIndex = 0; fileIndex < boardSquares.length; fileIndex++)
   {
      for (var rankIndex = 0; rankIndex < boardSquares[fileIndex].length; rankIndex++)
      {
          if(boardSquares[fileIndex][rankIndex] === symbol) return indexToCoord(fileIndex, rankIndex);
      }
   }
    board.error('King not found');
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
    //TODO: bug: validate that castling or en passant is actually occurring for the length
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
   else if (differences.length === 2)  //every other move
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
    else if(differences.length === 0) beforeBoard.error('Boards match.');  //This is an error because there is no move between them
    //else:
    messageUser('Before:\n' + beforeBoard.toString() + '\n\n' +
                'After:\n' + afterBoard.toString());
    throw new Error('Requires multiple moves.');
}
/**Resets the state of afterPositions*/
function resetState(beforeBoard, afterPositions, knownState)
{
    var move = findBoardMove(beforeBoard, afterPositions);  //get move required to go from beforeBoard to afterPositions
    var afterBoard = beforeBoard.copy();  //copy beforeBoard because I need to change it
    //don't switch turns. isWhitesTurn is for who can move next which I need in order to move

    //have the afterBoard do that move
    if(move === 'KC') afterBoard.performKingsCastle();
    else if(move === 'QC') afterBoard.performQueensCastle();
    else if(move.enPassantOccurred) afterBoard.performEnPassant(move.source);
    else afterBoard.move(move.source, move.destination, move.promotedTo);  //promotedTo might be undefined

    if(knownState !== undefined) afterBoard.changeState(knownState);

    //now afterBoard has the same positions as afterPositions
    //but because the movement functions were used the state will be correct
    //therefore correct the state of afterPositions
    afterPositions.changeState(afterBoard.getState());
}

/**I created and posted this on stack overflow:
http://stackoverflow.com/questions/6226189/how-to-convert-a-string-to-bytearray/30836196#30836196
Technically accepts and returns ISO-Latin-1 not just Ascii.
*/
function stringToAsciiByteArray(str)
{
    var bytes = [];
   for (var i = 0; i < str.length; ++i)
   {
       var charByte = str.charCodeAt(i);
       if(charByte > 255) throw new Error('Illegal character '+str[i]+' ('+charByte+') @ '+i+': ' + str);
       bytes.push(charByte);
   }
    return bytes;
}

function addLeading0s(numberString, minimumDigits)
{
    while(numberString.length < minimumDigits){numberString = '0' + numberString;}
    return numberString;
}

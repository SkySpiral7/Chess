/**The string returned has piece locations and the information that follows.*/
var Write = {};
Write.FenRow = function(board, fullMoveCount)
{
    var state = board.getState();
    var result = Write.FenBoard(board) + ' ';

    if(board.isWhitesTurn()) result += 'w ';
    else result += 'b ';

    var castleAbilityString = '';
    if(state.white.canKingsCastle) castleAbilityString += 'K';
    if(state.white.canQueensCastle) castleAbilityString += 'Q';
    if(state.black.canKingsCastle) castleAbilityString += 'k';
    if(state.black.canQueensCastle) castleAbilityString += 'q';
    if(castleAbilityString === '') castleAbilityString = '-';
    result += castleAbilityString + ' ';

    //TODO: board doesn't yet implement state.halfMoveCount
    result += state.enPassantSquare + ' 0 ' + fullMoveCount;

    return result;
}

/**The string returned is only the piece locations.*/
Write.FenBoard = function(board)
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

Write.FriendlyCoordinateNotationMove = function(beforeBoard, afterBoard)
{
    var move = findBoardMove(beforeBoard, afterBoard);
    if(move === 'KC' || move === 'QC') return move;

    var result = beforeBoard.getPiece(move.source);  //start with piece symbol
    result += move.source + '-' + move.destination;

    var capturedPiece = afterBoard.getState().capturedPiece;
    if(capturedPiece === 'EN') result += 'EN';
    else if(capturedPiece !== '1') result += 'x' + capturedPiece;

    if(move.promotedTo !== undefined) result += '=' + move.promotedTo;
    //TODO: doesn't detect +#
    return result.toUpperCase();
}

Write.GameBoardSquareArray = function(game)
{
    var resultArray = [];
   for (var i=0; i < game.getBoardArray().length; i++)
   {
       resultArray.push(game.getBoard(i).getBoardSquares());
   }
    var resultString = JSON.stringify(resultArray).replace(/"/g, '\'');
    resultString = resultString.replace(/\],\[/g, '],\r\n       [');
    resultString = resultString.replace(/\]\],/g, ']\r\n   ],');
    resultString = resultString.replace(/       \[\[/g, '   [\r\n       [');
    return resultString;
}

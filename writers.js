var Write = {};
//TODO: save the gameTerminator and tags in game when parsing
Write.VariableGameNotation = function(game, gameTerminator, allTags)
{
    if(allTags == null) allTags = {};
    if(allTags.GameFormat == null) allTags.GameFormat = 'PGN';
    if(allTags.MoveFormat == null) allTags.MoveFormat = 'SAN';

    var gameFormat = allTags.GameFormat.toString().trim().replace(/:.*$/, '').toUpperCase();
    if(gameFormat !== 'VGN') throw new Error('GameFormat ' + allTags.GameFormat +' is not supported.');

    var writer;
    var moveFormat = allTags.MoveFormat.toString().trim().replace(/:.*$/, '').toUpperCase();
    if(moveFormat === 'FCN') writer = Write.FriendlyCoordinateNotationMove;
    else if(moveFormat === 'FEN') writer = Write.FenRow;
    else throw new Error('MoveFormat ' + allTags.MoveFormat +' is not supported.');

    var isBinary = (binaryFormats.indexOf(moveFormat) !== -1);
    var gameText = '';
   for (var tag in allTags)
   {
       if(!allTags.hasOwnProperty(tag)) continue;
       if(isBinary && tag === 'MoveFormat') continue;  //MoveFormat must be last for binary so add it after all other tags
       gameText += '[' + tag + ' "' + allTags[tag].replace(/"/g, '\\"') + '"]\r\n';
   }
    if(isBinary) gameText += '[MoveFormat "' + allTags.MoveFormat.replace(/"/g, '\\"') + '"]';  //can't have an end line after it

    //the move text section will correctly be empty if there is only 1 board (since the SetUp tag isn't supported)
       //although this function does allow you to pass in the SetUp tag, that isn't how it should be
   for (var i=1; i < game.getBoardArray().length; i++)
   {
       gameText += Math.floor((i+1)/2) + '. ';  //white's move #
       gameText += writer(game, i) + ' ';  //white's move
       i++;
       if(i < game.getBoardArray().length) gameText += writer(game, i) + '\r\n';  //black's move
   }
    return gameText + gameTerminator;
}

/**The string returned has piece locations and the information that follows.*/
Write.FenRow = function(game, index)
{
    var board = game.getBoard(index), fullMoveCount = Math.floor((index+1)/2);
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

Write.FriendlyCoordinateNotationMove = function(game, index)
{
    var beforeBoard = game.getBoard(index-1), afterBoard = game.getBoard(index);
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

/**This function returns 3D array which is an array of board states (each of which is a 2D array of board squares).
The array returned is used by "temp chess game.html" and by Write.FormatGameSquareArrayAsString.*/
Write.GameSquareArray = function(game)
{
    var resultArray = [];
   for (var i=0; i < game.getBoardArray().length; i++)
   {
       resultArray.push(game.getBoard(i).getBoardSquares());
   }
    return resultArray;
}

/**The string returned is pasted into "shell saved game.html" to preserve a chess game.
The array passed in must be like that returned by Write.GameSquareArray.
The array information isn't changed rather it is turned into a string and whiteSpace is added.*/
Write.FormatGameSquareArrayAsString = function(gameSquareArray)
{
    var resultString = JSON.stringify(gameSquareArray).replace(/"/g, '\'');
    resultString = resultString.replace(/\],\[/g, '],\r\n       [');
    resultString = resultString.replace(/\]\],/g, ']\r\n   ],');
    resultString = resultString.replace(/       \[\[/g, '   [\r\n       [');
    resultString = resultString.replace('[[[', '[\r\n   [\r\n       [');
    resultString = resultString.replace(']]]', ']\r\n   ]\r\n]');
    return resultString;
}

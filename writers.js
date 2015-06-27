/*
The only game format support for writing is:
VGN: Variable Game Notation: http://skyspiral7.blogspot.com/2015/05/vgn-variable-game-notation.html
PGN isn't supported by the writer because it can't write file extensions
    PGN: Portable Game Notation: https://web.archive.org/web/20100528142843/http://www.very-best.de/pgn-spec.htm

Supported move text formats for writers:
BCCF: Binary Compressed Coordinate Format version 1.1
BCFEN: Binary Compressed Fen version 1.1
FCN: Friendly Coordinate Notation version 1.1
FEN: Forsyth-Edwards Notation: http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
MCN: Minimum Coordinate Notation

Definitions of version 1.0 of BCCF, BCFEN, MCN, FCN: http://skyspiral7.blogspot.com/2015/04/chess-notation.html
Definitions of version 1.1 of BCCF, BCFEN, FCN: http://skyspiral7.blogspot.com/2015/05/chess-notation-updates-11.html
*/
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
    if(moveFormat === 'BCCF') writer = Write.BinaryCompressedCoordinateFormatMove;
    else if(moveFormat === 'BCFEN') writer = Write.BinaryCompressedFenRow;
    else if(moveFormat === 'FCN') writer = Write.FriendlyCoordinateNotationMove;
    else if(moveFormat === 'FEN') writer = Write.FenRow;
    else if(moveFormat === 'MCN') writer = Write.MinimumCoordinateNotationMove;
    else throw new Error('MoveFormat ' + allTags.MoveFormat + ' is not supported.');

    var isBinary = (binaryFormats.indexOf(moveFormat) !== -1);
    var gameText = writeTagSection(allTags, isBinary);
    return writeMoveTextSection(game, gameText, gameTerminator, isBinary);

   function writeTagSection(allTags, isBinary)
   {
       var gameText = '';
      for (var tag in allTags)
      {
          if(!allTags.hasOwnProperty(tag)) continue;
          if(isBinary && tag === 'MoveFormat') continue;  //MoveFormat must be last for binary so add it after all other tags
          gameText += '[' + tag + ' "' + allTags[tag].replace(/"/g, '\\"') + '"]\r\n';
      }
       if(isBinary) gameText += '[MoveFormat "' + allTags.MoveFormat.replace(/"/g, '\\"') + '"]';  //can't have an end line after it
       return gameText;
   }
   function writeMoveTextSection(game, gameText, gameTerminator, isBinary)
   {
       //the move text section will correctly be empty if there is only 1 board (since the SetUp tag isn't supported)
          //although this function does allow you to pass in the SetUp tag, that isn't how it should be
      if (isBinary)
      {
         for (var i=1; i < game.getBoardArray().length; i++)
         {
             gameText += writer(game, i);  //white's move
             i++;
             if(i < game.getBoardArray().length) gameText += writer(game, i);  //black's move
         }
          return writer(game, i, gameTerminator, gameText);  //each binary writer handles game termination differently
      }

      //else if plain text:
      for (var i=1; i < game.getBoardArray().length; i++)
      {
          gameText += Math.floor((i+1)/2) + '. ';  //white's move #
          gameText += writer(game, i) + ' ';  //white's move
          i++;
          if(i < game.getBoardArray().length) gameText += writer(game, i) + '\r\n';  //black's move
      }
       return gameText + gameTerminator;
   }
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

Write.MinimumCoordinateNotationMove = function(game, index)
{
    var beforeBoard = game.getBoard(index-1), afterBoard = game.getBoard(index);
    var move = findBoardMove(beforeBoard, afterBoard);

   if (move === 'KC' || move === 'QC')
   {
       if(move === 'KC' && beforeBoard.isWhitesTurn()) return 'E1G1';
       if(move === 'QC' && beforeBoard.isWhitesTurn()) return 'E1C1';
       if(move === 'KC') return 'E8G8';  //black's turn
       return 'E8C8';  //black QC
   }

    var result = move.source + move.destination;
    if(move.promotedTo !== undefined) result += move.promotedTo;
    return result.toUpperCase();
}

/**Note that the output string is in US-ASCII.*/
Write.BinaryCompressedCoordinateFormatMove = function(game, index, gameTerminator, gameText)
{
    //(000 000, 000 000) 00 0 0. (source, destination) promotedTo didPromote isGameOver
    if(gameTerminator !== undefined) return gameText;  //the game terminator was included in the previous move so append nothing

    var beforeBoard = game.getBoard(index-1), afterBoard = game.getBoard(index);
    var move = findBoardMove(beforeBoard, afterBoard);
    var resultString;

    //I'll write in base 2 to resultString then parse it. This is the easiest way to append bits
   if (move === 'KC' || move === 'QC')
   {
       if(move === 'KC' && beforeBoard.isWhitesTurn()) resultString = '100 000' + '110 000';  //E1-G1 => 4,0 - 6,0
       else if(move === 'QC' && beforeBoard.isWhitesTurn()) resultString = '100 000' + '010 000';  //E1-C1 => 4,0 - 2,0
       else if(move === 'KC') resultString = '100 111' + '110 111';  //black's turn. E8-G8 => 4,7 - 6,7
       else resultString = '100 111' + '010 111';  //black QC. E8-C8 => 4,7 - 2,7

       resultString = resultString.replace(/ /g, '');  //remove all spaces
       resultString += '000';  //no promotion
   }
   else
   {
       move.source = coordToIndex(move.source);
       move.destination = coordToIndex(move.destination);
       resultString = addLeading0s(move.source[0].toString(2), 3) + addLeading0s(move.source[1].toString(2), 3);
       resultString += addLeading0s(move.destination[0].toString(2), 3) + addLeading0s(move.destination[1].toString(2), 3);
       if(move.promotedTo !== undefined) move.promotedTo = move.promotedTo.toUpperCase();

       if(move.promotedTo === 'N') resultString += '01';
       else if(move.promotedTo === 'B') resultString += '10';
       else if(move.promotedTo === 'Q') resultString += '11';
       else resultString += '00';  //rook or no promotion

       if(move.promotedTo === undefined) resultString += '0';
       else resultString += '1';
   }

    if(game.getBoardArray().length-1 === index) resultString += '1';  //game is over because this is the last move
    else resultString += '0';

    //use substring instead of & to avoid big/little endian confusion (the string uses big but numbers use little)
    var firstByte = Number.parseInt(resultString.substr(0, 8), 2);
    var secondByte = Number.parseInt(resultString.substr(8, 8), 2);

    return String.fromCharCode(firstByte, secondByte);
}

/**Note that the output string is in US-ASCII.*/
Write.BinaryCompressedFenRow = function(game, index, gameTerminator, gameText)
{
    if(gameTerminator !== undefined) return gameText + String.fromCharCode(0x88);

    var resultString = '', tempString = '';
    var boardSquares = game.getBoard(index).getBoardSquares();
   for (var rankIndex = 7; rankIndex >= 0; rankIndex--)  //fen starts at rank 8 and is grouped by rank
   {
      for (var fileIndex = 0; fileIndex < 8; fileIndex++)
      {
          tempString += lookUp(boardSquares[fileIndex][rankIndex])
         if (tempString.length === 2)
         {
             resultString += String.fromCharCode(Number.parseInt(tempString, 16));
             tempString = '';
         }
      }
   }
    return resultString;
    function lookUp(symbol){return Write.BinaryCompressedFenRow.symbolToHexString[symbol];}
}
/*
0000 0: Empty square
0001 1: White Rook
0010 2: White Knight
0011 3: White Bishop
0100 4: White Queen
0101 5: White King
0110 6: White Pawn
0111 7
1000 8: Game termination (is actually 0x88)
1001 9: Black Rook
1010 A: Black Knight
1011 B: Black Bishop
1100 C: Black Queen
1101 D: Black King
1110 E: Black Pawn
1111 F
*/
Write.BinaryCompressedFenRow.symbolToHexString = {
    '1': '0',

    'R': '1',
    'N': '2',
    'B': '3',
    'Q': '4',
    'K': '5',
    'P': '6',

    'r': '9',
    'n': 'A',
    'b': 'B',
    'q': 'C',
    'k': 'D',
    'p': 'E'
};

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

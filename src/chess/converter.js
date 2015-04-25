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

var Parse = {};
Parse.PortableGameNotation = function(text)
{
    //PGN original definition: https://web.archive.org/web/20100528142843/http://www.very-best.de/pgn-spec.htm
   //game sanitation
    text = text.trim();
    if(text[0] === '%') text[0] = ';';  //section 6. the useless token that does the same thing as an already existing one
    text = text.replace(/\r\n?/g, '\n');  //section 3.2.2: export uses \n but imports should allow whatever end line
    text = text.replace(/;.*?\n/g, '');  //section 5. rest of line comment. the only thing that requires end lines
    text = text.replace(/;.*$/, '');  //remove the single line comment at the end since it doesn't have an end line
    text = text.replace(/\s+/g, ' ');  //section 7 and others indicate that all other white space is treated the same
    text = text.replace(/\\"|\\/g, '');  //there are no strings that I read in which " or \ could be used. so ignore for easy parsing
    //TODO: the above technically corrupts the move text section

   //tag section
    var setUp, format = 'san';  //default is for compatibility
    var tagRegEx = /^ ?\[ ?(\w+) "([^"]*)" ?\]/;
    var tag = tagRegEx.exec(text);
   while (tag !== null)
   {
       var name = tag[1].toLowerCase();
       var value = tag[2].toLowerCase();

       if(name === 'format') format = value;
       //if(name === 'setup')  //TODO: SetUp tag not yet supported

       text = text.replace(tagRegEx, '');  //remove the tag I just read
       tag = tagRegEx.exec(text);
   }

    //TODO: put sections into functions
   //find parser
    var parser;
    format = format.replace(/:.*$/, '');  //remove the first : and everything after it
    if(format === 'mcn') parser = Parse.MinimumCoordinateNotationGame;
    else if(format === 'fcn') parser = Parse.FriendlyCoordinateNotationGame;
    else if(format === 'sfen') parser = Parse.ShortenedFenGame;
    else throw new Error('Move text format '+format.toUpperCase() +' is not supported.');
    //TODO: doesn't support binary format

   //move text sanitation
    text = text.replace(/\[.*?\]/g, '');  //section 5. remove block comments
    text = text.replace(/\$\d+/g, '');  //section 7. remove Numeric Annotation Glyph (NAG)
    text = text.replace(/\b\d+\.*(?:\.| )/g, '');  //section 7 and 8.2.2. remove move numbers which are optional
    //text = text.replace(/\(.*?\)/g, '');  //section 7. Recursive Annotation Variations (RAV) TODO: are not so easily removed

   //move text section
    var moveArray = [];
    var moveRegEx = /^ ?(\S+)(?: (\S+))?/;  //TODO: this regex doesn't work for fen
    var moveText = moveRegEx.exec(text);
   while (moveText !== null)
   {
       moveArray.push(moveText[1]);  //white's move
       if(moveText[2] !== undefined) moveArray.push(moveText[2]);  //black's move

       text = text.replace(moveRegEx, '');  //remove the move text I just read
       moveText = moveRegEx.exec(text);
   }
    //game termination markers are thrown away. does not support multiple games

    return parser(moveArray);
}
//TODO: add validation to the parsers
//TODO: split parsers and writers etc into new files

Parse.MinimumCoordinateNotationGame = function(moveArray)
{
    // /^[A-H][1-8][A-H][1-8][QBNR]?$/i
    var game = new Game();
    for(var moveIndex = 0; moveIndex < moveArray.length; moveIndex++)
       {game.addBoard(Parse.MinimumCoordinateNotationMove(game.getBoard(), moveArray[moveIndex]));}
    return JSON.stringify(game.getBoard().getBoardSquares());
}

Parse.MinimumCoordinateNotationMove = function(board, text)
{
    //eg: a7a8q
    board = board.copy();
    board.move(text.substr(0, 2), text.substr(2, 2), text[4]);  //text[4] might be undefined
    board.switchTurns();
    return board;
}

Parse.FriendlyCoordinateNotationGame = function(moveArray)
{
    // /^(?:[KQ]C|P[A-H][1-8]-[A-H][1-8](?:EN|(?:X[QBNRP])?(?:=[QBNR])?)|[KQBNR][A-H][1-8]-[A-H][1-8](?:X[QBNRP])?)\+?#?$/i
    var game = new Game();
    for(var moveIndex = 0; moveIndex < moveArray.length; moveIndex++)
       {game.addBoard(Parse.FriendlyCoordinateNotationMove(game.getBoard(), moveArray[moveIndex]));}
    return game.getBoard();
}

Parse.FriendlyCoordinateNotationMove = function(board, text)
{
    //eg: Ra1-a8xQ, Pa7-B8xR=q or Pa7-A8=N, Pa5-b6en, KC, QC, Ra1-a8+#
    //this function doesn't copy board because it always delegates the movement to Parse.MinimumCoordinateNotationMove
    text = text.toLowerCase();
   if (board.isWhitesTurn())
   {
       if(text === 'kc') return Parse.MinimumCoordinateNotationMove(board, 'e1g1');
       if(text === 'qc') return Parse.MinimumCoordinateNotationMove(board, 'e1c1');
   }
   else  //if black's turn
   {
       if(text === 'kc') return Parse.MinimumCoordinateNotationMove(board, 'e8g8');
       if(text === 'qc') return Parse.MinimumCoordinateNotationMove(board, 'e8c8');
   }

    text = text.substring(1);  //remove piece symbol
    text = text.replace(/x./, '');  //remove capture information
    text = text.replace('en', '');  //ditto. I could have called board.performEnPassant() directly but MinimumCoordinateNotationMove will handle that
    text = text.replace(/[+#=-]/g, '');  //remove check/end game indicators and human friendly padding
    return Parse.MinimumCoordinateNotationMove(board, text);
}

Parse.ShortenedFenGame = function(moveArray)
{
   // /^(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb] (?:-|K?Q?k?q?)(?: [a-hA-H][1-8])?)?(?: (?:\+#|\+|#))?$/
    var game = new Game();
    for(var moveIndex = 0; moveIndex < moveArray.length; moveIndex++)
       {game.addBoard(Parse.ShortenedFenRow(game.getBoard().isWhitesTurn(), moveArray[moveIndex]));}
    game.resetStates();  //TODO: this overrides some state information already established (castling and en passant)
    return JSON.stringify(game.getBoard().getBoardSquares());
}

/**This parses the piece locations and the information that follows.*/
Parse.ShortenedFenRow = function(isWhitesTurn, text)
{
    //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq a2 +#
    text = text.replace(/\s+/g, ' ');
    var sections = text.split(' ');
    var board = new Board(!isWhitesTurn);  //assume the opposite turn if information isn't available

    if(sections.length === 1){Parse.FenBoard(board, text); return board;}

    var newState = {isWhitesTurn: (sections[1].toLowerCase() === 'w')};

    //newState.white.canKingsCastle = (sections[2][0] === 'K') it's the only one that can do that but I decided not to in order to keep them lined up
    newState.white = {canKingsCastle: (sections[2].indexOf('K') !== -1), canQueensCastle: (sections[2].indexOf('Q') !== -1)};
    newState.black = {canKingsCastle: (sections[2].indexOf('k') !== -1), canQueensCastle: (sections[2].indexOf('q') !== -1)};
    //if sections[2] === '-' then everything is already set to false

    if((/^[A-H][1-8]$/i).test(sections[3])) newState.enPassantSquare = sections[3].toUpperCase();

    //TODO: doesn't detect +#
    board.changeState(newState);
    Parse.FenBoard(board, sections[0]);
    return board;
}

/**This only parses the piece locations.*/
Parse.FenBoard = function(board, text)
{
    //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR
    //doesn't copy the board because a new one was passed in
    //this order is logical and most efficient due to slowest string growth rate
    text = text.replace(/2/g, '11');
    text = text.replace(/3/g, '111');
    text = text.replace(/4/g, '1111');
    text = text.replace(/5/g, '11111');
    text = text.replace(/6/g, '111111');
    text = text.replace(/7/g, '1111111');
    text = text.replace(/8/g, '11111111');
    //although not very clean this is better than string manipulation
    //I also thought it was better than doing inside the loop: if(/[2-8]/) loop: board.setPieceIndex(fileIndex, rankIndex, '1');
    var rankArray = text.split('/');
    rankArray.reverse();  //FEN starts with rank 8 instead of 1
   for (var rankIndex = 0; rankIndex < rankArray.length; rankIndex++)
   {
      for (var fileIndex = 0; fileIndex < rankArray[rankIndex].length; fileIndex++)
      {
          board.setPieceIndex(fileIndex, rankIndex, rankArray[rankIndex][fileIndex]);
      }
   }
}

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

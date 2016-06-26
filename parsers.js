/*
The only game format support for parsing is:
VGN: Variable Game Notation: http://skyspiral7.blogspot.com/2015/05/vgn-variable-game-notation.html
PGN isn't supported by the parser because it doesn't know file extensions
    PGN: Portable Game Notation: https://web.archive.org/web/20100528142843/http://www.very-best.de/pgn-spec.htm

Supported move text formats for parsers:
BCCF: Binary Compressed Coordinate Format version 1.1
BCFEN: Binary Compressed Fen version 1.1
FCN: Friendly Coordinate Notation version 1.1
MCN: Minimum Coordinate Notation
SFEN: Shortened Fen version 1.1

Definitions of version 1.0 of BCCF, BCFEN, MCN, FCN: http://skyspiral7.blogspot.com/2015/04/chess-notation.html
Definitions of version 1.1 of BCCF, BCFEN, FCN: http://skyspiral7.blogspot.com/2015/05/chess-notation-updates-11.html
*/
var binaryFormats = ['BCCF', 'BCFEN', 'PGC'];
var moveTextRegex = {};

var Parse = {};
//TODO: allow more than 1 game with functions Parse.VariableGameNotationFile and Parse.VariableGameNotationGame
Parse.VariableGameNotation = function(text)
{
    var tagReturnValue = Parse.VariableGameNotationTagSection(text);
    text = tagReturnValue.moveTextSection;
    var initialBoard = handleSetUp(tagReturnValue.allTags.SetUp);
    var parser = findParser(tagReturnValue.allTags.MoveFormat);
    if(tagReturnValue.isBinary) return parser(stringToAsciiByteArray(text));
    var moveArray = Parse.VariableGameNotationMoveTextSection(text, moveTextRegex[parser]);
    return gameCreation(initialBoard, parser, moveArray);

   function handleSetUp(setUpTagValue)
   {
       if(setUpTagValue === undefined) return;  //will pass undefined into Game
       var format = 'SFEN';  //default
      if (setUpTagValue.indexOf(':') !== -1)
      {
          format = setUpTagValue.replace(/:[\s\S]*$/, '').toUpperCase();  //remove the first : and everything after it
          setUpTagValue = setUpTagValue.substring(format.length + 1);
      }
       if(format === 'SFEN') return Parse.ShortenedFenRow(undefined, setUpTagValue);
       else throw new Error('SetUp Format ' + format + ' is not supported.');
   }
   function findParser(formatFullString)
   {
       var format = formatFullString.replace(/:[\s\S]*$/, '').toUpperCase();  //remove the first : and everything after it
       if(format === 'BCCF') return Parse.BinaryCompressedCoordinateFormatGame;
       else if(format === 'BCFEN') return Parse.BinaryCompressedFenGame;
       else if(format === 'FCN') return Parse.FriendlyCoordinateNotationMove;
       else if(format === 'MCN') return Parse.MinimumCoordinateNotationMove;
       else if(format === 'SFEN') return Parse.ShortenedFenRow;
       else throw new Error('MoveFormat ' + formatFullString + ' is not supported.');
   }
   function gameCreation(initialBoard, parser, moveArray)
   {
       var game = new Game(initialBoard);
      for (var moveIndex = 0; moveIndex < moveArray.length; moveIndex++)
      {
          try {
             parser(game, moveArray[moveIndex]);
          } catch(e) {
             messageUser('Error occurred on move ' + ((moveIndex / 2) + 1));
             throw e;
          }
      }
       return game;
   }
}

Parse.VariableGameNotationTagSection = function(text)
{
    //outputs
    var allTags = {GameFormat: 'PGN', MoveFormat: 'SAN'};  //defaults
    var isBinary = false;

    //aggregators
    var tagName = '', tagString = '';

    //substates
    var tagStringIsEscaped = false;
    /**index/cursor/position*/
    var i = 0;

    //TODO: sort all functions (and states etc) alphabetically
    var states = {BlockComment: /0/, LineComment: /1/, Tag: /2/, TagString: /3/, TagName: /4/, Top: /5/, MoveText: /6/};
    //the states enum doesn't use {} because the argument passed into [] is converted into a string
    //therefore each of the states needs a unique toString value otherwise stateMachine would only keep the last one
    var currentState = states.Top;
    var stateMachine = {};
   stateMachine[states.BlockComment] = function()
   {
       if(text[i] === '}') return states.Top;
       return states.BlockComment;
   };
   stateMachine[states.LineComment] = function()
   {
       if(text[i] === '\r' || text[i] === '\n') return states.Top;
          //obviously functional for old Mac and Unix end lines
          //also includes Windows \r\n because \r ends it and \n is ignored as whiteSpace
       return states.LineComment;
   };
   stateMachine[states.TagString] = function()
   {
       //currently allows tag strings to contain end lines
      if (tagStringIsEscaped)
      {
          tagString += text[i];  //treats all escaped characters as literal even if it didn't need to be escaped
          tagStringIsEscaped = false;
          return states.TagString;
      }
       if(text[i] === '"') return states.Tag;
       if(text[i] === '\\') tagStringIsEscaped = true;
       else tagString += text[i];
       return states.TagString;
   };
   stateMachine[states.TagName] = function()
   {
       if(!(/^[\w\s]$/).test(text[i])) throw new SyntaxError('A tag name must be followed by white space:\n' + text.substring(0, (i+1)));
       if(text[i].trim() === '') return states.Tag;  //whiteSpace ends the name
       tagName += text[i];
       return states.TagName;
   };
   stateMachine[states.Top] = function()
   {
       if(text[i] === ';') return states.LineComment;
       if(text[i] === '{') return states.BlockComment;
       if(text[i] === '[') return states.Tag;
       if(text[i].trim() === '') return states.Top;  //ignore whiteSpace
       //isBinary = false;  //already is false
       return states.MoveText;  //anything else would be the first character of the move text section
   };
   stateMachine[states.Tag] = function()
   {
       if(text[i].trim() === '') return states.Tag;  //ignore whiteSpace
       if((/^\w$/).test(text[i]) && tagName !== '') throw new SyntaxError('A tag can\'t contain more than 1 name:\n' + text.substring(0, (i+1)));
       if((/^\w$/).test(text[i])){tagName += text[i]; return states.TagName;}
       if(text[i] === '"' && tagString !== '') throw new SyntaxError('A tag can\'t contain more than 1 string:\n' + text.substring(0, (i+1)));
       if(text[i] === '"') return states.TagString;
      if (text[i] === ']')
      {
          allTags[tagName] = tagString;  //save string as-is.
          tagString = tagString.trim().replace(/:[\s\S]*$/, '').toUpperCase();  //remove the first : and everything after it
         if (tagName === 'MoveFormat' && binaryFormats.indexOf(tagString) !== -1)
         {
             isBinary = true;
             //if is binary format then tagSection is over
             //anything that follows (whiteSpace, []{};, etc) are binary values for the move text section
             ++i;  //move i to the first index of the move text section
             return states.MoveText;
         }
          tagName = tagString = '';
          return states.Top;
      }
       throw new SyntaxError('Illegal character found in tag:\n' + text.substring(0, (i+1)));
   };

    if(text[0] === '%') text = ';' + text.substring(1);  //PGN section 6. the useless token that does the same thing as an already existing one
       //even though VGN doesn't allow this, it is easier to allow it then it is to throw
   for (; i < text.length; ++i)
   {
       currentState = stateMachine[currentState]();
       if(currentState === states.MoveText) break;
   }
    if(currentState === states.BlockComment) throw new SyntaxError('Block comment never ended:\n' + text);
    if(currentState === states.TagString) throw new SyntaxError('Tag string never ended:\n' + text);
    if(currentState === states.Tag || currentState === states.TagName) throw new SyntaxError('Tag never ended:\n' + text);
    //Top, MoveText, and LineComment are all fine final states
    if(!(/^VGN(?::.*?)?$/i).test(allTags.GameFormat)) throw new Error('GameFormat ' + allTags.GameFormat +' is not supported.');

    return {allTags: allTags, moveTextSection: text.substr(i), isBinary: isBinary};
}

Parse.VariableGameNotationMoveTextSection = function(text, formatRegex)
{
    //state indicators:
    var inBlockComment = false;
    var inLineComment = false;
    var ravDepth = 0;

    /**index/cursor/position*/
    var i = 0;

    //used for output:
    var moveArray = [];

    //used for parsing:
    var moveNumberRegex = /^(?:\d+\.(?:\.\.|5)? )/;
    var nagRegex = /^\$\d+/;

   for (; i < text.length; ++i)
   {
      if (inLineComment)
      {
          if(text[i] === '\r' || text[i] === '\n') inLineComment = false;
             //obviously functional for old Mac and Unix end lines
             //also includes Windows \r\n because \r ends it and \n is ignored as whiteSpace
          continue;
      }
      if (inBlockComment)
      {
          if(text[i] === '}') inBlockComment = false;
          continue;
      }
      //to ignore rav I'm treating it as nestable comments
      //this must occur after the comment states above because rav can contain real comments
      if (ravDepth !== 0)
      {
          if(text[i] === '(') ravDepth++;
          else if(text[i] === ')') ravDepth--;
          continue;
      }
       if(text[i] === ';') inLineComment = true;
       else if(text[i] === '{') inBlockComment = true;
       else if(text[i] === '(') ravDepth++;
       else if(text[i].trim() === ''){}  //ignore whiteSpace
      else if (moveNumberRegex.test(text.substring(i)))
      {
          var moveNumber = moveNumberRegex.exec(text.substring(i))[0];
          i += moveNumber.length-1;
      }
      else if (nagRegex.test(text.substring(i)))
      {
          var nag = nagRegex.exec(text.substring(i))[0];
          i += nag.length-1;
      }
       else if((/^(?:\*|1-0|0-1|1\/2-1\/2)\s*$/).test(text.substring(i))) break;
          //game termination markers are thrown away but required. does not support multiple games
      else if (formatRegex.test(text.substring(i)))
      {
          var move = formatRegex.exec(text.substring(i))[0];
          moveArray.push(move);
          i += move.length-1;
      }
      else
      {
          messageUser('Error occurred on move ' + ((moveArray.length / 2) + 1));
          throw new SyntaxError('Regex: ' + formatRegex + ' doesn\'t match input starting with:\n' + text.substring(i));
      }
   }
   if (text.substring(i) === '')
   {
       messageUser('Error occurred after move ' + ((moveArray.length + 1) / 2));
       if(inBlockComment) throw new SyntaxError('Block comment never ended:\n' + text);
       if(ravDepth !== 0) throw new SyntaxError('Unclosed RAVs. Need ' + ravDepth + ' more )s:\n' + text);
       //all other end of input (if inLineComment or not):
       throw new SyntaxError('Game termination marker missing:\n' + text);
   }
    return moveArray;
}

Parse.MinimumCoordinateNotationMove = function(game, text)
{
    //eg: a7a8q
    game.move(text.substr(0, 2), text.substr(2, 2), text[4]);  //text[4] might be undefined
}
moveTextRegex[Parse.MinimumCoordinateNotationMove] = /^[A-H][1-8][A-H][1-8][QBNR]?/i;

Parse.FriendlyCoordinateNotationMove = function(game, text)
{
    //eg: Ra1-a8xQ, Pa7-B8xR=q+#+, Pa7-A8=N, Pa5-b6en+#, KC#, Ra1-a8##
    var beforeBoard = game.getBoard();
    text = text.toUpperCase();
    if((/^KC\+?#?[+#]?$/).test(text)){game.performKingsCastle(); return;}
    if((/^QC\+?#?[+#]?$/).test(text)){game.performQueensCastle(); return;}

    var regexResult = (/^([KQBNRP])([A-H][1-8])-([A-H][1-8])(EN|(?:X[QBNRP])?)(?:=([QBNR]))?\+?#?[+#]?$/).exec(text);

    var pieceMoved = regexResult[1];
    var source = regexResult[2];
    var destination = regexResult[3];
    var captured = regexResult[4];  //might be empty string
    var promotedTo = regexResult[5];  //might be undefined

    var actualPieceMoved = beforeBoard.getPiece(source).toUpperCase();
    if(actualPieceMoved === '1' && validation !== validationLevel.off) beforeBoard.error('Move was ' + text + ' but that square is empty.');
    if(pieceMoved !== actualPieceMoved && validation !== validationLevel.off) beforeBoard.error('Move was ' + text + ' but the board\'s piece is ' + actualPieceMoved);

    if(captured === '') captured = '1';
   else
   {
       if(captured === 'EN'){game.performEnPassant(source); return;}
       captured = captured[1];  //remove 'X'
   }

    game.move(source, destination, promotedTo);

    var actualCapturedPiece = game.getBoard().getState().capturedPiece.toUpperCase();  //get from the after board
   if (captured !== actualCapturedPiece && validation !== validationLevel.off)
   {
       if(actualCapturedPiece === '1') beforeBoard.error('Move was ' + text + ' but nothing was captured.');
       beforeBoard.error('Move was ' + text + ' but ' + actualCapturedPiece + ' was captured.');
   }
}
moveTextRegex[Parse.FriendlyCoordinateNotationMove] = /^(?:P[A-H][1-8]-[A-H][1-8](?:EN|(?:X[QBNRP])?(?:=[QBNR])?)|[KQBNR][A-H][1-8]-[A-H][1-8](?:X[QBNRP])?|[KQ]C)\+?(?:#[+#]?)?/i

/**This parses the piece locations and the information that follows.
It returns a board so that it can be used for starting positions.*/
//TODO: reuse Parse.ShortenedFenRow to make Parse.FenRow
//TODO: bug is ignoring the first move of SFEN
Parse.ShortenedFenRow = function(game, text)
{
    //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq a2 +#
    if(!new RegExp(moveTextRegex[Parse.ShortenedFenRow].source+'$').test(text)) throw new SyntaxError(text + ' is not valid SFEN. Regex: ' + moveTextRegex[Parse.ShortenedFenRow]);
    //this is the only parse method that immediately checks moveTextRegex.
    //This function needs to do so because the SetUp tag's syntax hasn't been validated yet.

    var hasBeforeBoard = (game !== undefined && game !== null);
    var beforeBoard, afterBoard;

    var originalText = text;
    text = text.replace(/\s+/g, ' ').trim();
    var sections = text.split(' ');
    if(hasBeforeBoard) beforeBoard = game.getBoard();
    if(hasBeforeBoard) afterBoard = new Board(beforeBoard.isWhitesTurn());
       //isWhitesTurn is for who can move next just like FEN's move indicator
       //if previous board said white was next then assume that I'm moving for white if the information isn't available
    else afterBoard = new Board(true);

    Parse.FenBoard(game, afterBoard, sections.shift());

   if (sections.length === 0)
   {
       if(hasBeforeBoard) resetState(beforeBoard, afterBoard);  //default the state if no information is available
       return afterBoard;
   }

    var newState = {};
    if((/^[WBwb]$/).test(sections[0])) newState.isWhitesTurn = (sections.shift().toLowerCase() === 'w');

   if (sections[0] !== undefined && (/^(?:-|[KQkq]{1,4})$/).test(sections[0]))
   {
       if(!(/^(?:-|K?Q?k?q?)$/).test(sections[0])) throw new SyntaxError('Illegal Castling info: ' + originalText);
       //newState.white.canKingsCastle = (sections[0][0] === 'K') it's the only one that can do that but I decided not to in order to keep them lined up
       newState.white = {canKingsCastle: (sections[0].indexOf('K') !== -1), canQueensCastle: (sections[0].indexOf('Q') !== -1)};
       newState.black = {canKingsCastle: (sections[0].indexOf('k') !== -1), canQueensCastle: (sections[0].indexOf('q') !== -1)};
       //if sections[0] === '-' then everything is already set to false
       sections.shift();

       if(sections[0] !== undefined && (/^[A-H][1-8]$/i).test(sections[0])) newState.enPassantSquare = sections.shift().toUpperCase();
       else if(sections[0] === '-'){newState.enPassantSquare = '1'; sections.shift();}
   }
   //if there is a section left then it is game markers: +#

    if(hasBeforeBoard) resetState(beforeBoard, afterBoard, newState);
    else afterBoard.changeState(newState);
    return afterBoard;
}
moveTextRegex[Parse.ShortenedFenRow] = /^(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb])?(?: (?:-|[KQkq]{1,4})(?: -| [a-hA-H][1-8])?)?(?: \+?(?:#[+#]?)?)?/;

/**This only parses the piece locations.*/
Parse.FenBoard = function(game, board, text)
{
    //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR
    if((/\d\d+/).test(text)) throw new SyntaxError('Invalid board: ' + text);  //can't have adjacent numbers
    //doesn't copy the board because a new one was passed in

    var originalText = text;
    //this order is logical and most efficient due to slowest string growth rate
    text = text.replace(/2/g, '11');
    text = text.replace(/3/g, '111');
    text = text.replace(/4/g, '1111');
    text = text.replace(/5/g, '11111');
    text = text.replace(/6/g, '111111');
    text = text.replace(/7/g, '1111111');
    text = text.replace(/8/g, '11111111');
    //although not very clean this is better than string manipulation
    //I also thought it was better than doing inside the loop: if(/[2-8]/) loop: board.setPieceByIndex(fileIndex, rankIndex, '1');

    var boardRegex = /^(?:[KQBNRPkqbnrp1]{8}\/){7}[KQBNRPkqbnrp1]{8}$/;
    if(!boardRegex.test(text)) throw new SyntaxError('Invalid board: ' + originalText);
    //after this point the entire board section is valid

    var rankArray = text.split('/');
    rankArray.reverse();  //FEN starts with rank 8 instead of 1
   for (var rankIndex = 0; rankIndex < rankArray.length; rankIndex++)
   {
      for (var fileIndex = 0; fileIndex < rankArray[rankIndex].length; fileIndex++)
      {
          board.setPieceByIndex(fileIndex, rankIndex, rankArray[rankIndex][fileIndex]);
      }
   }
}

Parse.BinaryCompressedCoordinateFormatGame = function(byteArray)
{
    var game = new Game();
   while (true)
   {
       if(byteArray.length === 1) game.error('Expecting length 2 actual: 1');
       if(Parse.BinaryCompressedCoordinateFormatMove(game, byteArray.shift(), byteArray.shift())) break;
   }
    if(byteArray.length !== 0) game.error('Expecting length 0 actual: ' + byteArray.length);
    return game;
}

/**@returns true if the game is over*/
Parse.BinaryCompressedCoordinateFormatMove = function(game, firstByte, secondByte)
{
    //(000 000, 000 000) 00 0 0. (source, destination) promotedTo didPromote isGameOver
    //converting to a base 2 string is the easiest way to index bits
    var text = addLeading0s(firstByte.toString(2), 8) + addLeading0s(secondByte.toString(2), 8);

    var file, rank, source, destination, promotedTo;
    var binaryStringToSymbol = {'00': 'R', '01': 'N', '10': 'B', '11': 'Q'};

    file = Number.parseInt(text.substr(0, 3), 2);
    rank = Number.parseInt(text.substr(3, 3), 2);
    source = indexToCoord(file, rank);

    file = Number.parseInt(text.substr(6, 3), 2);
    rank = Number.parseInt(text.substr(9, 3), 2);
    destination = indexToCoord(file, rank);

    promotedTo = binaryStringToSymbol[text.substr(12, 2)];
    if(text.substr(14, 1) === '0') promotedTo = undefined;
    else if(!isWhitesTurn) promotedTo.toLowerCase();

    game.move(source, destination, promotedTo);
    return (text.substr(15, 1) === '1');  //returns true if game is over
}

Parse.BinaryCompressedFenGame = function(byteArray)
{
    var game = new Game();
   while (byteArray.length > 1)
   {
       if(byteArray.length < 32) game.error('Expecting length 32 actual: ' + byteArray.length);
       game.addBoard(Parse.BinaryCompressedFenBoard(game.getBoard(), byteArray.splice(0, 32)));
   }
    if(byteArray.length !== 1) game.error('Expecting length 1 actual: 0');
    if(byteArray[0] !== 0x88) game.error('Missing game termination marker. Got: 0x' + byteArray[0].toString(16).toUpperCase());
    return game;
}

/**This only parses the piece locations.*/
Parse.BinaryCompressedFenBoard = function(beforeBoard, byteArray)
{
    var afterBoard = new Board(beforeBoard.isWhitesTurn());
       //isWhitesTurn is for who can move next and I'm moving next. the turn will be switched later by resetState

    var squareFlatArray = [];
   for (var i = 0; i < byteArray.length; ++i)  //byteArray.length is always 32
   {
       squareFlatArray.push(lookUp((byteArray[i] & 0xF0) >>> 4));
       squareFlatArray.push(lookUp(byteArray[i] & 0x0F));
   }
    //squareFlatArray.length is always 64 which is equal to the number of squares
    var squareFlatIterator = {i:-1, next: function(){return squareFlatArray[++this.i];}};

   for (var rankIndex = 7; rankIndex >= 0; rankIndex--)  //fen starts at rank 8 and is grouped by rank
   {
      for (var fileIndex = 0; fileIndex < 8; fileIndex++)
      {
          afterBoard.setPieceByIndex(fileIndex, rankIndex, squareFlatIterator.next());
      }
   }
    resetState(beforeBoard, afterBoard);
    return afterBoard;
    function lookUp(nibble){return Parse.BinaryCompressedFenBoard.nibbleToSymbol[nibble];}
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
Parse.BinaryCompressedFenBoard.nibbleToSymbol = {
    0x0: '1',

    0x1: 'R',
    0x2: 'N',
    0x3: 'B',
    0x4: 'Q',
    0x5: 'K',
    0x6: 'P',

    0x9: 'r',
    0xA: 'n',
    0xB: 'b',
    0xC: 'q',
    0xD: 'k',
    0xE: 'p'
};

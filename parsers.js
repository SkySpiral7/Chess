/*
The only game format support for parsing is:
VGN: Variable Game Notation: http://skyspiral7.blogspot.com/2015/05/vgn-variable-game-notation.html
PGN isn't supported by the parser because it doesn't know file extensions
    PGN: Portable Game Notation: https://web.archive.org/web/20100528142843/http://www.very-best.de/pgn-spec.htm

Supported move text formats for parsers:
MCN: Minimum Coordinate Notation: http://skyspiral7.blogspot.com/2015/04/chess-notation.html
FCN: Friendly Coordinate Notation version 1.1: http://skyspiral7.blogspot.com/2015/05/chess-notation-updates-11.html
SFEN: Shortened Fen version 1.1
*/
var binaryFormats = ['BCCF', 'BCFEN', 'PGC'];
var moveTextRegex = {};

var Parse = {};
//TODO: allow more than 1 game with functions Parse.VariableGameNotationFile and Parse.VariableGameNotationGame
Parse.VariableGameNotation = function(text)
{
    //VGN definition: http://skyspiral7.blogspot.com/2015/05/vgn-variable-game-notation.html
    //PGN original definition: https://web.archive.org/web/20100528142843/http://www.very-best.de/pgn-spec.htm
    var tagReturnValue = Parse.VariableGameNotationTagSection(text);
    //TODO: SetUp tag not yet supported
    text = tagReturnValue.moveTextSection;
    var parser = findParser(tagReturnValue.allTags.MoveFormat);
    var moveArray = Parse.VariableGameNotationMoveTextSection(text, moveTextRegex[parser]);
    return gameCreation(parser, moveArray);

   function findParser(formatFullString)
   {
       var format = formatFullString.replace(/:.*$/, '').toUpperCase();  //remove the first : and everything after it
       if(format === 'MCN') return Parse.MinimumCoordinateNotationMove;
       else if(format === 'FCN') return Parse.FriendlyCoordinateNotationMove;
       else if(format === 'SFEN') return Parse.ShortenedFenRow;
       else throw new Error('MoveFormat ' + formatFullString +' is not supported.');
       //TODO: I currently don't have parsers for any binary format
   }
   function gameCreation(parser, moveArray)
   {
       var game = new Game();
      for (var moveIndex = 0; moveIndex < moveArray.length; moveIndex++)
      {
          var didThrow = true;
         try
         {
             game.addBoard(parser(game.getBoard(), moveArray[moveIndex]));
             didThrow = false;
         }
         finally
         {
             if(didThrow) console.log('Error occurred on move ' + ((moveIndex / 2) + 1));
         }
      }
       return game;
   }
}

Parse.VariableGameNotationTagSection = function(text)
{
    //state indicators:
    var inBlockComment = false;
    var inLineComment = false;
    var inTag = false;
    var inTagString = false;

    /**index/cursor/position*/
    var i = 0;

    //used for output:
    var isBinary = false;
    var allTags = {GameFormat: 'PGN', MoveFormat: 'SAN'};  //defaults

    //string aggregators used by allTags:
    var tagName = '';
    var tagString = '';

    if(text[0] === '%') text[0] = ';';  //PGN section 6. the useless token that does the same thing as an already existing one
       //even though VGN doesn't allow this, it is easier to allow it then it is to throw
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
      if (inTagString)
      {
          if(text[i] === '"' && text[i-1] !== '\\') inTagString = false;
          else tagString += text[i];
          continue;
      }
      if (inTag)
      {
          if(text[i] === '"' && tagString !== '') throw new SyntaxError('A tag can\'t contain more than 1 string:\n' + text.substring(0, (i+1)));
          if(text[i] === '[') throw new SyntaxError('A tag can\'t contain a tag:\n' + text.substring(0, (i+1)));
          if(text[i] === '"'){inTagString = true; continue;}
         if (text[i] === ']')
         {
             tagName = tagName.trim();
             allTags[tagName] = tagString;  //save string as-is.
             tagString = tagString.trim().replace(/:.*$/, '').toUpperCase();  //remove the first : and everything after it
            if (tagName === 'MoveFormat' && binaryFormats.indexOf(tagString) !== -1)
            {
                isBinary = true;
                //if is binary format then tagSection is over
                //anything that follows (whiteSpace, []{};, etc) are binary values for the move text section
                ++i;  //move i to the first index of the move text section
                break;
            }
             inTag = false;
             tagName = tagString = '';
             continue;
         }
          //PGN allows either comment to exist anywhere in a tag
          //this finite state machine can read both PGN and VGN which is why it allows comments here
          //so even though VGN doesn't allow comments inside tags, it is easier to allow it then to throw
          if(text[i] === ';') inLineComment = true;
          else if(text[i] === '{') inBlockComment = true;
          else tagName += text[i];
          continue;
      }
       if(text[i] === ';') inLineComment = true;
       else if(text[i] === '{') inBlockComment = true;
       else if(text[i] === '[') inTag = true;
       else if(text[i].trim() === ''){}  //ignore whiteSpace
       //anything else would be the first character of the move text section
       else break;
   }
    if(!(/^VGN(?::.*?)?$/i).test(allTags.GameFormat)) throw new Error('GameFormat ' + allTags.GameFormat +' is not supported.');
    return {allTags: allTags, moveTextSection: text.substr(i), isBinary: isBinary};
}
//TODO: currently doesn't support binary... maybe binary should be a separate function
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
       else if((/^(?:\*|1-0|0-1|1\/2-1\/2)$/).test(text.substring(i))) break;
          //game termination markers are thrown away but required. does not support multiple games
      else if (formatRegex.test(text.substring(i)))
      {
          var move = formatRegex.exec(text.substring(i))[0];
          moveArray.push(move);
          i += move.length-1;
      }
      else
      {
          console.log('Error occurred on move ' + ((moveArray.length / 2) + 1));
          throw new SyntaxError('Regex: ' + formatRegex + ' doesn\'t match input starting with ' + text.substring(i));
      }
   }
   if (text.substring(i) === '')
   {
       console.log('Error occurred after move ' + ((moveArray.length + 1) / 2));
       throw new SyntaxError('Game termination marker missing.');
   }
    return moveArray;
}

Parse.MinimumCoordinateNotationMove = function(board, text)
{
    //eg: a7a8q
    board = board.copy();
    board.move(text.substr(0, 2), text.substr(2, 2), text[4]);  //text[4] might be undefined
    board.switchTurns();
    return board;
}
moveTextRegex[Parse.MinimumCoordinateNotationMove] = /^[A-H][1-8][A-H][1-8][QBNR]?/i;

Parse.FriendlyCoordinateNotationMove = function(board, text)
{
    //eg: Ra1-a8xQ, Pa7-B8xR=q+#+, Pa7-A8=N, Pa5-b6en+#, KC#, Ra1-a8##
    board = board.copy();
    text = text.toUpperCase();
    if((/^KC\+?#?[+#]?$/).test(text)){board.performKingsCastle(); board.switchTurns(); return board;}
    if((/^QC\+?#?[+#]?$/).test(text)){board.performQueensCastle(); board.switchTurns(); return board;}

    var regexResult = (/^([KQBNRP])([A-H][1-8])-([A-H][1-8])(EN|(?:X[QBNRP])?)(?:=([QBNR]))?\+?#?[+#]?$/).exec(text);

    var pieceMoved = regexResult[1];
    var source = regexResult[2];
    var destination = regexResult[3];
    var captured = regexResult[4];  //might be empty string
    var promotedTo = regexResult[5];  //might be undefined

    var actualPieceMoved = board.getPiece(source).toUpperCase();
    if(actualPieceMoved === '1') board.error('Move was ' + text + ' but that square is empty.');
    if(pieceMoved !== actualPieceMoved) board.error('Move was ' + text + ' but the board\'s piece is ' + actualPieceMoved);

    if(captured === '') captured = '1';
   else
   {
       if(captured === 'EN'){board.performEnPassant(source); board.switchTurns(); return board;}
       captured = captured[1];  //remove 'X'
   }

    board.move(source, destination, promotedTo);

    var actualCapturedPiece = board.getState().capturedPiece.toUpperCase();
   if (captured !== actualCapturedPiece)
   {
       if(actualCapturedPiece === '1') board.error('Move was ' + text + ' but nothing was captured.');
       board.error('Move was ' + text + ' but ' + actualCapturedPiece + ' was captured.');
   }

    board.switchTurns();
    return board;
}
moveTextRegex[Parse.FriendlyCoordinateNotationMove] = /^(?:P[A-H][1-8]-[A-H][1-8](?:EN|(?:X[QBNRP])?(?:=[QBNR])?)|[KQBNR][A-H][1-8]-[A-H][1-8](?:X[QBNRP])?|[KQ]C)\+?(?:#[+#]?)?/i

/**This parses the piece locations and the information that follows.*/
Parse.ShortenedFenRow = function(beforeBoard, text)
{
    //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq a2 +#
    var nonEmptyCastling = /^(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb])?(?: (?:-|[KQkq]{1,4})(?: -| [a-hA-H][1-8])?)?(?: \+?(?:#[+#]?)?)?$/;
    if(!nonEmptyCastling.test(text)) throw new SyntaxError('Too many spaces: ' + text);
    //Verbose error message: Castling ability can't be empty if provided (or there was an extra space)
    //the use of both regular expressions (nonEmptyCastling and moveTextRegex) has validated everything after the board

    text = text.replace(/\s+/g, ' ').trim();
    var sections = text.split(' ');
    var afterBoard;
    var hasBeforeBoard = (beforeBoard !== undefined && beforeBoard !== null);
    if(hasBeforeBoard) afterBoard = new Board(beforeBoard.isWhitesTurn());
       //isWhitesTurn is for who can move next just like FEN's move indicator
       //if previous board said white was next then assume that I'm moving for white if the information isn't available
    else afterBoard = new Board(true);

    Parse.FenBoard(afterBoard, sections.shift());

   if (sections.length === 0)
   {
       if(hasBeforeBoard) resetState(beforeBoard, afterBoard);  //default the state if no information is available
       return afterBoard;
   }

    var newState = {};
    if((/^[WBwb]$/).test(sections[0])) newState.isWhitesTurn = (sections.shift().toLowerCase() === 'w');

   if (sections[0] !== undefined && !(/^(?:-|[KQkq]{1,4})$/).test(sections[0]))
   {
       //newState.white.canKingsCastle = (sections[0][0] === 'K') it's the only one that can do that but I decided not to in order to keep them lined up
       newState.white = {canKingsCastle: (sections[0].indexOf('K') !== -1), canQueensCastle: (sections[0].indexOf('Q') !== -1)};
       newState.black = {canKingsCastle: (sections[0].indexOf('k') !== -1), canQueensCastle: (sections[0].indexOf('q') !== -1)};
       //if sections[0] === '-' then everything is already set to false
       sections.shift();
   }

    if(sections[0] !== undefined && (/^[A-H][1-8]$/i).test(sections[0])) newState.enPassantSquare = sections.shift().toUpperCase();
    else if(sections[0] === '-') sections.shift();  //newState.enPassantSquare is already set to 1
    //TODO: doesn't detect +#

    if(hasBeforeBoard) resetState(beforeBoard, afterBoard, newState);
    return afterBoard;
}
moveTextRegex[Parse.ShortenedFenRow] = /^(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb])?(?: (?:-|K?Q?k?q?)(?: -| [a-hA-H][1-8])?)?(?: \+?(?:#[+#]?)?)?/;

/**This only parses the piece locations.*/
Parse.FenBoard = function(board, text)
{
    //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR
    var originalText = text;
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

    var boardRegex = /^(?:[KQBNRPkqbnrp8]{8}\/){7}[KQBNRPkqbnrp8]{8}$/;
    if(!boardRegex.test(text)) throw new SyntaxError('Invalid board: ' + originalText);
    //if this passes then the entire half move text is valid

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

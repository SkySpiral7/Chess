//TODO: move into chess repo
var binaryFormats = ['BCCF', 'BCFEN', 'PGC'];

var Parse = {};
Parse.VariableGameNotation = function(text)
{
    //VGN definition: http://skyspiral7.blogspot.com/2015/05/vgn-variable-game-notation.html
    //PGN original definition: https://web.archive.org/web/20100528142843/http://www.very-best.de/pgn-spec.htm
    var tagReturnValue = Parse.VariableGameNotationTagSection(text);
    //TODO: SetUp tag not yet supported
    text = tagReturnValue.moveTextSection;
    var parser = findParser(tagReturnValue.allTags.MoveFormat);
    text = moveTextSanitation(text);
    var moveArray = moveTextSection(text, moveTextRegex[parser]);  //although text is modified it doesn't need to be returned because it isn't used again
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
   //TODO: replace the move text section parsing with a finite state machine as well
      //an example reason is that comments are not handled correct if nested. also RAV
   function moveTextSanitation(text)
   {
       //all section comments are per PGN doc
       text = text.replace(/\r\n?/g, '\n');  //section 3.2.2: export uses \n but imports should allow whatever end line
       text = text.replace(/;.*?\n/g, ' ');  //section 5. rest of line comment. the only thing that requires end lines
       text = text.replace(/;.*$/, '');  //remove the single line comment at the end since it doesn't have an end line
       text = text.replace(/\s+/g, ' ');  //section 7 and others indicate that all other white space is treated the same
       text = text.replace(/\{.*?\}/g, '');  //section 5. remove block comments
       text = text.replace(/\$\d+/g, '');  //section 7. remove Numeric Annotation Glyph (NAG)
       //text = text.replace(/\(.*?\)/g, '');  //section 7. Recursive Annotation Variations (RAV) TODO: are not so easily removed
       return text;
   }
   function moveTextSection(text, formatRegex)
   {
       var moveArray = [];
       var moveNumberRegex = /(?:\d+\.* )/;
       //section 7 and 8.2.2. move numbers are optional and are allowed to appear before each half move
       var moveRegExString = moveNumberRegex.source + '?(' + formatRegex.source + ')';
       moveRegExString = '^' + moveRegExString + '(?: ' + moveRegExString + ')?';
       var moveRegEx = new RegExp(moveRegExString, getRegexFlags(formatRegex));
       text = text.trim();
       var moveText = moveRegEx.exec(text);
      while (moveText !== null)
      {
          moveArray.push(moveText[1]);  //white's move
          if(moveText[2] !== undefined) moveArray.push(moveText[2]);  //black's move

          text = text.replace(moveRegEx, '').trim();  //remove the move text I just read
          moveText = moveRegEx.exec(text);
      }
       //game termination markers are thrown away but required. does not support multiple games
      if (text === '')
      {
          console.log('Error occurred after move ' + ((moveArray.length / 2) + 1));
          throw new SyntaxError('Game termination marker missing.');
      }
      if (!(/^(?:\*|1-0|0-1|1\/2-1\/2)$/).test(text))
      {
          console.log('Error occurred on move ' + ((moveArray.length / 2) + 1));
          throw new SyntaxError('Regex: ' + formatRegex + ' doesn\'t match input starting with ' + text);
      }
       return moveArray;
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

var moveTextRegex = {};
Parse.MinimumCoordinateNotationMove = function(board, text)
{
    //eg: a7a8q
    board = board.copy();
    board.move(text.substr(0, 2), text.substr(2, 2), text[4]);  //text[4] might be undefined
    board.switchTurns();
    return board;
}
moveTextRegex[Parse.MinimumCoordinateNotationMove] = /[A-H][1-8][A-H][1-8][QBNR]?/i;

Parse.FriendlyCoordinateNotationMove = function(board, text)
{
    //eg: Ra1-a8xQ, Pa7-B8xR=q+#+, Pa7-A8=N, Pa5-b6en+#, KC#, Ra1-a8##
    board = board.copy();
    text = text.toUpperCase();
    if((/^KC\+?#?$/).test(text)){board.performKingsCastle(); board.switchTurns(); return board;}
    if((/^QC\+?#?$/).test(text)){board.performQueensCastle(); board.switchTurns(); return board;}

    var regexResult = (/^([KQBNRP])([A-H][1-8])-([A-H][1-8])(EN|(?:X[QBNRP])?)(?:=([QBNR]))?\+?#?$/).exec(text);

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
moveTextRegex[Parse.FriendlyCoordinateNotationMove] = /(?:P[A-H][1-8]-[A-H][1-8](?:EN|(?:X[QBNRP])?(?:=[QBNR])?)|[KQBNR][A-H][1-8]-[A-H][1-8](?:X[QBNRP])?|[KQ]C)\+?#?/i;

//TODO: update regex
// /^(?:P[A-H][1-8]-[A-H][1-8](?:EN|(?:X[QBNRP])?(?:=[QBNR])?)|[KQBNR][A-H][1-8]-[A-H][1-8](?:X[QBNRP])?|[KQ]C)\+?(?:#[+#]?)?$/i

/**This parses the piece locations and the information that follows.*/
Parse.ShortenedFenRow = function(beforeBoard, text)
{
    //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq a2 +#
    text = text.replace(/\s+/g, ' ');
    var sections = text.split(' ');
    var afterBoard;
    var hasBeforeBoard = (beforeBoard !== undefined && beforeBoard !== null);
    if(hasBeforeBoard) afterBoard = new Board(beforeBoard.isWhitesTurn());
       //isWhitesTurn is for who can move next just like FEN's move indicator
       //if previous board said white was next then assume that I'm moving for white if the information isn't available
    else afterBoard = new Board(true);

    Parse.FenBoard(afterBoard, sections[0]);

   if (sections.length === 1)
   {
       if(hasBeforeBoard) resetState(beforeBoard, afterBoard);  //default the state if no information is available
       return afterBoard;
   }

    var newState = {isWhitesTurn: (sections[1].toLowerCase() === 'w')};

   if (sections[2] !== undefined)
   {
       //newState.white.canKingsCastle = (sections[2][0] === 'K') it's the only one that can do that but I decided not to in order to keep them lined up
       newState.white = {canKingsCastle: (sections[2].indexOf('K') !== -1), canQueensCastle: (sections[2].indexOf('Q') !== -1)};
       newState.black = {canKingsCastle: (sections[2].indexOf('k') !== -1), canQueensCastle: (sections[2].indexOf('q') !== -1)};
       //if sections[2] === '-' then everything is already set to false
   }

    if(sections[3] !== undefined && (/^[A-H][1-8]$/i).test(sections[3])) newState.enPassantSquare = sections[3].toUpperCase();
    //TODO: doesn't detect +#

    if(hasBeforeBoard) resetState(beforeBoard, afterBoard, newState);
    return afterBoard;
}
moveTextRegex[Parse.ShortenedFenRow] = /(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb] (?:-|K?Q?k?q?)(?: [a-hA-H][1-8])?)?(?: (?:\+#|\+|#))?/;

//TODO: update regex
// /^(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb])?(?: (?:-|K?Q?k?q?)(?: -| [a-hA-H][1-8])?)?(?: \+?(?:#[+#]?)?)?$/;

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

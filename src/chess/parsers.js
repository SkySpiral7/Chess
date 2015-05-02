var Parse = {};
Parse.PortableGameNotation = function(text)
{
    //PGN original definition: https://web.archive.org/web/20100528142843/http://www.very-best.de/pgn-spec.htm
    text = gameSanitation(text);
    var tagReturnValue = tagSection(text);
    text = tagReturnValue.text;
    var parser = findParser(tagReturnValue.format);
    text = moveTextSanitation(text);
    var moveArray = moveTextSection(text, moveTextRegex[parser]);  //although text is modified it doesn't need to be returned because it isn't used again
    return gameCreation(parser, moveArray);

   function gameSanitation(text)
   {
       text = text.trim();
       if(text[0] === '%') text[0] = ';';  //section 6. the useless token that does the same thing as an already existing one
       text = text.replace(/\{[\s\S]*?\}/g, '');  //section 5. remove block comments
       text = text.replace(/\r\n?/g, '\n');  //section 3.2.2: export uses \n but imports should allow whatever end line
       text = text.replace(/;.*?\n/g, ' ');  //section 5. rest of line comment. the only thing that requires end lines
       text = text.replace(/;.*$/, '');  //remove the single line comment at the end since it doesn't have an end line
       text = text.replace(/\s+/g, ' ');  //section 7 and others indicate that all other white space is treated the same
       text = text.replace(/\\"|\\/g, '');  //there are no strings that I read in which " or \ could be used. so ignore for easy parsing
       return text;
       //TODO: gameSanitation technically corrupts the move text section
       //TODO: comments are not handled correctly as I do not check to see if {}; is in a string, move text, or comment etc
   }
   function tagSection(text)
   {
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
       return {format: format, setUp: setUp, text: text};
   }
   function findParser(format)
   {
       format = format.replace(/:.*$/, '');  //remove the first : and everything after it
       if(format === 'mcn') return Parse.MinimumCoordinateNotationMove;
       else if(format === 'fcn') return Parse.FriendlyCoordinateNotationMove;
       else if(format === 'sfen') return Parse.ShortenedFenRow;
       else throw new Error('Move text format '+format.toUpperCase() +' is not supported.');
       //TODO: doesn't support binary format
   }
   function moveTextSanitation(text)
   {
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
       //game termination markers are thrown away. does not support multiple games
      if (!(/^(?:\*|1-0|0-1|1\/2-1\/2|)$/).test(text))  //note the final |. text is allowed to be an empty string
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
    //eg: Ra1-a8xQ, Pa7-B8xR=q or Pa7-A8=N, Pa5-b6en, KC, QC, Ra1-a8+#
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

/**This parses the piece locations and the information that follows.*/
Parse.ShortenedFenRow = function(beforeBoard, text)
{
    //eg: rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq a2 +#
    text = text.replace(/\s+/g, ' ');
    var sections = text.split(' ');
    var afterBoard = new Board(beforeBoard.isWhitesTurn());
       //isWhitesTurn is for who can move next just like FEN's move indicator
       //if previous board said white was next then assume that I'm moving for white if the information isn't available

    Parse.FenBoard(afterBoard, sections[0]);

   if (sections.length === 1)
   {
       resetState(beforeBoard, afterBoard);  //default the state if no information is available
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

    resetState(beforeBoard, afterBoard, newState);
    return afterBoard;
}
moveTextRegex[Parse.ShortenedFenRow] = /(?:[KQBNRPkqbnrp1-8]{1,8}\/){7}[KQBNRPkqbnrp1-8]{1,8}(?: [WBwb] (?:-|K?Q?k?q?)(?: [a-hA-H][1-8])?)?(?: (?:\+#|\+|#))?/;

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

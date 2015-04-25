var Parse = {};
Parse.PortableGameNotation = function(text)
{
    //PGN original definition: https://web.archive.org/web/20100528142843/http://www.very-best.de/pgn-spec.htm
    text = gameSanitation(text);
    var tagReturnValue = tagSection(text);
    text = tagReturnValue.text;
    var parser = findParser(tagReturnValue.format);
    text = moveTextSanitation(text);
    var moveArray = moveTextSection(text);  //although text is modified it doesn't need to be returned because it isn't used again
    return parser(moveArray);

   function gameSanitation(text)
   {
       text = text.trim();
       if(text[0] === '%') text[0] = ';';  //section 6. the useless token that does the same thing as an already existing one
       text = text.replace(/\r\n?/g, '\n');  //section 3.2.2: export uses \n but imports should allow whatever end line
       text = text.replace(/;.*?\n/g, '');  //section 5. rest of line comment. the only thing that requires end lines
       text = text.replace(/;.*$/, '');  //remove the single line comment at the end since it doesn't have an end line
       text = text.replace(/\s+/g, ' ');  //section 7 and others indicate that all other white space is treated the same
       text = text.replace(/\\"|\\/g, '');  //there are no strings that I read in which " or \ could be used. so ignore for easy parsing
       return text;
       //TODO: gameSanitation technically corrupts the move text section
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
       if(format === 'mcn') return Parse.MinimumCoordinateNotationGame;
       else if(format === 'fcn') return Parse.FriendlyCoordinateNotationGame;
       else if(format === 'sfen') return Parse.ShortenedFenGame;
       else throw new Error('Move text format '+format.toUpperCase() +' is not supported.');
       //TODO: doesn't support binary format
   }
   function moveTextSanitation(text)
   {
       text = text.replace(/\[.*?\]/g, '');  //section 5. remove block comments
       text = text.replace(/\$\d+/g, '');  //section 7. remove Numeric Annotation Glyph (NAG)
       text = text.replace(/\b\d+\.*(?:\.| )/g, '');  //section 7 and 8.2.2. remove move numbers which are optional
       //text = text.replace(/\(.*?\)/g, '');  //section 7. Recursive Annotation Variations (RAV) TODO: are not so easily removed
       return text;
   }
   function moveTextSection(text)
   {
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
       return moveArray;
   }
}
//TODO: add validation to the parsers

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

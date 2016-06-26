//sigh... I should have done TDD

TestSuite.parsers={};
TestSuite.parsers.VariableGameNotationTagSection={};
TestSuite.parsers.VariableGameNotationTagSection.errors=function(isFirst)
{
    TestRunner.clearResults(isFirst);

    var testResults = [];
    var actionTaken;
    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationTagSection('{Yo');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Block Comment.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Block comment never ended:\n{Yo'), Actual: e, Description: actionTaken+': Block Comment'});
   }

    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationTagSection('[Date');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Tag.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Tag never ended:\n[Date'), Actual: e, Description: actionTaken+': Tag'});
   }

    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationTagSection('[Date "2015-');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Tag string.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Tag string never ended:\n[Date "2015-'), Actual: e, Description: actionTaken+': Tag string'});
   }

    try {
    actionTaken = 'Nested';
    Parse.VariableGameNotationTagSection('[Date "2015"\n[EndDate "2016"]]');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Tags.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Illegal character found in tag:\n[Date "2015"\n['), Actual: e, Description: actionTaken+': Tags'});
   }

    try {
    actionTaken = 'Multiple';
    Parse.VariableGameNotationTagSection('[Date "2015" "Sep"]');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Tag strings.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('A tag can\'t contain more than 1 string:\n[Date "2015" "'), Actual: e, Description: actionTaken+': Tag strings'});
   }

    try {
    actionTaken = 'Multiple';
    Parse.VariableGameNotationTagSection('[End Date "2015"]');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Tag names: space.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('A tag can\'t contain more than 1 name:\n[End D'), Actual: e, Description: actionTaken+': Tag names: space'});
   }

    try {
    actionTaken = 'Multiple';
    Parse.VariableGameNotationTagSection('[End{}Date "2015"]');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Tag names: comment.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('A tag name must be followed by white space:\n[End{'), Actual: e, Description: actionTaken+': Tag names: comment'});
   }

    try {
    actionTaken = 'Unsupported';
    Parse.VariableGameNotationTagSection('[GameFormat "PSG:Fake"]');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with GameFormat: Text.');
    }
   catch(e)
   {
       testResults.push({Expected: new Error('GameFormat PSG:Fake is not supported.'), Actual: e, Description: actionTaken+': GameFormat: Text'});
   }

    try {
    actionTaken = 'Unsupported';
    Parse.VariableGameNotationTagSection('[MoveFormat "BCCF"][GameFormat "VGN"]');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with GameFormat: Binary.');
    }
   catch(e)
   {
       testResults.push({Expected: new Error('GameFormat PGN is not supported.'), Actual: e, Description: actionTaken+': GameFormat: Binary'});
   }

    return TestRunner.displayResults('Parse.VariableGameNotationTagSection errors', testResults, isFirst);
};
TestSuite.parsers.VariableGameNotationTagSection.happy=function(isFirst)
{
    TestRunner.clearResults(isFirst);

    var testResults=[];
    var actionTaken, expected;

    try{
    actionTaken='Simple';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'MCN', Date: '2015'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][MoveFormat "MCN"][Date "2015"] Move Text')), Description: actionTaken+': Text'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Simple';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'BCCF'}, moveTextSection: '[Date "2015"]{ Move Text', isBinary: true};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][MoveFormat "BCCF"][Date "2015"]{ Move Text')), Description: actionTaken+': Binary'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Escaped';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN', Black: 'Mario "Jumpman" Mario'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][Black "Mario \\"Jumpman\\" Mario"]Move Text')), Description: actionTaken+': Tag String: quote'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Escaped';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN', OsFolder: 'C:\\Windows'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][OsFolder "C:\\\\Windows"]Move Text')), Description: actionTaken+': Tag String: backslash'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Escaped';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN', SaveToFolder: '\\\\NetworkFolder'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][SaveToFolder "\\\\\\\\NetworkFolder"]Move Text')), Description: actionTaken+': Tag String: double backslash'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Escaped';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN', Black: 'Me'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][Black "\\Me"]Move Text')), Description: actionTaken+': Tag String: other'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Line comment';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('%Yo\n[GameFormat "VGN"]Move Text')), Description: actionTaken+': Useless Token %'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Line comment';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection(';Yo\r[GameFormat "VGN"]Move Text')), Description: actionTaken+': Old Mac End line'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Line comment';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection(';Yo\r\n[GameFormat "VGN"]Move Text')), Description: actionTaken+': Windows End line'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Line comment';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: '', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"];Yo')), Description: actionTaken+': Unended'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Ignore';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('\n[\t  GameFormat\n"VGN"\t]\tMove Text')), Description: actionTaken+': White space'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Ignore';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: '', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"]')), Description: actionTaken+': Empty game'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    return TestRunner.displayResults('Parse.VariableGameNotationTagSection happy', testResults, isFirst);
};
TestSuite.parsers.VariableGameNotationMoveTextSection={};
TestSuite.parsers.VariableGameNotationMoveTextSection.errors=function(isFirst)
{
    TestRunner.clearResults(isFirst);

    var testResults = [];
    var actionTaken;
    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationMoveTextSection('{Yo', /a+/);
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Block Comment.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Block comment never ended:\n{Yo'), Actual: e, Description: actionTaken+': Block Comment'});
   }

    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationMoveTextSection('(Yo', /a+/);
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with RAV.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Unclosed RAVs. Need 1 more )s:\n(Yo'), Actual: e, Description: actionTaken+': RAV'});
   }

    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationMoveTextSection('(Yo)(()(', /a+/);
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with RAV.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Unclosed RAVs. Need 2 more )s:\n(Yo)(()('), Actual: e, Description: actionTaken+': RAV'});
   }

    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationMoveTextSection('a', /a+/);
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Game 1.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Game termination marker missing:\na'), Actual: e, Description: actionTaken+': Game 1'});
   }

    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationMoveTextSection('a ', /a+/);
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Game 2.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Game termination marker missing:\na '), Actual: e, Description: actionTaken+': Game 2'});
   }

    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationMoveTextSection('', /a+/);
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Empty.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Game termination marker missing:\n'), Actual: e, Description: actionTaken+': Empty'});
   }

    try {
    actionTaken = 'Multiple';
    Parse.VariableGameNotationMoveTextSection('1. 2.5 a *', /a+/);
    //TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Turn numbers.');
    //it's fine that the parser is forgiving
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('A move can\'t have more than 1 move number:\n1. 2.5 '), Actual: e, Description: actionTaken+': Turn numbers'});
   }

    try {
    actionTaken = 'Format';
    Parse.VariableGameNotationMoveTextSection('aaa b *', /a+/);
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Move Regex.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Regex: /a+/ doesn\'t match input starting with:\nb *'), Actual: e, Description: actionTaken+': Move Regex'});
   }

    return TestRunner.displayResults('Parse.VariableGameNotationMoveTextSection errors', testResults, isFirst);
};
TestSuite.parsers.VariableGameNotationMoveTextSection.happy=function(isFirst)
{
    TestRunner.clearResults(isFirst);

    var testResults=[];
    var actionTaken, expected;

    try{
    actionTaken='Simple';
    testResults.push({Expected: ['aaa', 'a'], Actual: Parse.VariableGameNotationMoveTextSection('aaa a *', /a+/), Description: actionTaken+': Text'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Line comment';
    testResults.push({Expected: ['aaa', 'a'], Actual: Parse.VariableGameNotationMoveTextSection(';Yo\naaa a 1-0', /a+/), Description: actionTaken+': Unix End line'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Line comment';
    testResults.push({Expected: ['aaa', 'a'], Actual: Parse.VariableGameNotationMoveTextSection(';Yo\raaa a 0-1  ', /a+/), Description: actionTaken+': Old Mac End line'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Line comment';
    testResults.push({Expected: ['aaa', 'a'], Actual: Parse.VariableGameNotationMoveTextSection(';Yo\r\naaa a 1/2-1/2\n', /a+/), Description: actionTaken+': Windows End line'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Ignore';
    testResults.push({Expected: ['aaa', 'a'], Actual: Parse.VariableGameNotationMoveTextSection('\t\taaa\na\t *\t', /a+/), Description: actionTaken+': White space'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Ignore';
    testResults.push({Expected: [], Actual: Parse.VariableGameNotationMoveTextSection('*', /a+/), Description: actionTaken+': Empty game'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Move Numbers';
    testResults.push({Expected: ['aaa', 'a', 'aa', 'a'], Actual: Parse.VariableGameNotationMoveTextSection('1. aaa 1.5 a aa 2.5 a *', /a+/), Description: actionTaken+': Text'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='NAG';
    testResults.push({Expected: ['aaa', 'a'], Actual: Parse.VariableGameNotationMoveTextSection('1. aaa $51656 $1613 a $0 *', /a+/), Description: actionTaken+': Text'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    return TestRunner.displayResults('Parse.VariableGameNotationMoveTextSection happy', testResults, isFirst);
};
TestSuite.parsers.ShortenedFenRow=function(isFirst)
{
    TestRunner.clearResults(isFirst);

    var testResults=[];
    var actionTaken, expected;
    var boardString = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ';

    try{
    actionTaken='Simple';
    testResults.push({Expected: new Board(true), Actual: Parse.ShortenedFenRow(null, boardString+'w KQkq -'), Description: actionTaken+': Text'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Black\'s Turn';
    testResults.push({Expected: new Board(false), Actual: Parse.ShortenedFenRow(null, boardString+'b KQkq -'), Description: actionTaken+': Text'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Can\'t castle';
    var state = {white: {canKingsCastle: false, canQueensCastle: false},
       black: {canKingsCastle: false, canQueensCastle: false}};
    var expected = new Board(true);
    expected.changeState(state);
    testResults.push({Expected: expected, Actual: Parse.ShortenedFenRow(null, boardString+'w - -'), Description: actionTaken+': Text'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='En Passant';
    var state = {enPassantSquare: 'A3'};
    var expected = new Board(true);
    expected.changeState(state);
    testResults.push({Expected: expected, Actual: Parse.ShortenedFenRow(null, boardString+'w - a3'), Description: actionTaken+': Text'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='No info';
    testResults.push({Expected: new Board(true), Actual: Parse.ShortenedFenRow(null, boardString), Description: actionTaken+': Trailing Space'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='No info';
    testResults.push({Expected: new Board(true), Actual: Parse.ShortenedFenRow(null, boardString.substring(0, boardString.length-1)), Description: actionTaken+': No Trailing Space'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='No En Passant';
    var state = {white: {canKingsCastle: false, canQueensCastle: false},
       black: {canKingsCastle: false, canQueensCastle: false}};
    var expected = new Board(true);
    expected.changeState(state);
    testResults.push({Expected: expected, Actual: Parse.ShortenedFenRow(null, boardString+'w -'), Description: actionTaken+': Can\'t Castle'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='No En Passant';
    testResults.push({Expected: new Board(true), Actual: Parse.ShortenedFenRow(null, boardString+'w KQkq'), Description: actionTaken+': Can Castle'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='No castle';
    testResults.push({Expected: new Board(false), Actual: Parse.ShortenedFenRow(null, boardString+'b'), Description: actionTaken+': Text'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Ignore';
    testResults.push({Expected: new Board(false), Actual: Parse.ShortenedFenRow(null, boardString+'b +#+'), Description: actionTaken+': End markers'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try{
    actionTaken='Some castling';
    var state = {white: {canKingsCastle: false, canQueensCastle: true},
       black: {canKingsCastle: true, canQueensCastle: false}};
    var expected = new Board(true);
    expected.changeState(state);
    testResults.push({Expected: expected, Actual: Parse.ShortenedFenRow(null, boardString+'b Qk'), Description: actionTaken+': Text'});
    } catch(e){testResults.push({Error: e, Description: actionTaken});}

    try {
    actionTaken = 'Format';
    Parse.ShortenedFenRow(null, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b a3');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Move Regex.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b a3 is not valid SFEN. Regex: ' + moveTextRegex[Parse.ShortenedFenRow]), Actual: e, Description: actionTaken+': Move Regex'});
   }

    try {
    actionTaken = 'Format';
    Parse.ShortenedFenRow(null, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b QQ a3');
    TestRunner.failedToThrow(testResults, actionTaken+': Failed to throw with Move Regex.');
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Illegal Castling info: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b QQ a3'), Actual: e, Description: actionTaken+': Move Regex'});
   }

    return TestRunner.displayResults('Parse.ShortenedFenRow', testResults, isFirst);
};
/*Test these (possibly not a complete list)
core:
{
   Board:
   {
      changeState
      setAll
      handlePawnMove
      performEnPassant
      //castling has nothing to test if the functions called are tested
   }
}
movement:
{
   perpetuateMove
   isKingsCastleLegal
   isQueensCastleLegal
   getAllLegalMoves
}
parsers:
{
   Parse.VariableGameNotation: test SetUp at least
   moveTextRegex[Parse.MinimumCoordinateNotationMove]
   Parse.FriendlyCoordinateNotationMove
   moveTextRegex[Parse.FriendlyCoordinateNotationMove]
   moveTextRegex[Parse.ShortenedFenRow]
   Parse.FenBoard
   Parse.BinaryCompressedCoordinateFormatMove
   Parse.BinaryCompressedFenBoard
}
pieces:
{
   findAllMyPieces
   all pieces have complicated moves but might be hard to test getAllMoves
   Pawn.getAllMoves
}
util:
{
   findBoardMove
}
writers:
{
   Write.VariableGameNotation
   Write.FenBoard
   Write.FriendlyCoordinateNotationMove
   Write.BinaryCompressedCoordinateFormatMove
   Write.BinaryCompressedFenRow
}
*/

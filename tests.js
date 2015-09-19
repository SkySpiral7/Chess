//sigh... I should have done TDD

//should I move this into TesterUtility?
var catchFailed = function(action, description){return {Expected: 'throw', Actual: 'return', Action: action, Description: description};};

Tester.parsers={};
Tester.parsers.testAll=function(isFirst){TesterUtility.testAll(this, isFirst);};
Tester.parsers.VariableGameNotationTagSection={};
Tester.parsers.VariableGameNotationTagSection.testAll=function(isFirst){TesterUtility.testAll(this, isFirst);};
Tester.parsers.VariableGameNotationTagSection.errors=function(isFirst)
{
    TesterUtility.clearResults(isFirst);

    var testResults = [];
    var actionTaken;
    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationTagSection('{Yo');
    testResults.push(catchFailed(actionTaken, 'Failed to throw with Block Comment.'));
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Block comment never ended:\n{Yo'), Actual: e, Action: actionTaken, Description: 'Block Comment'});
   }
    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationTagSection('[Date');
    testResults.push(catchFailed(actionTaken, 'Failed to throw with Tag.'));
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Tag never ended:\n[Date'), Actual: e, Action: actionTaken, Description: 'Tag'});
   }
    try {
    actionTaken = 'Unclosed';
    Parse.VariableGameNotationTagSection('[Date "2015-');
    testResults.push(catchFailed(actionTaken, 'Failed to throw with Tag string.'));
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Tag string never ended:\n[Date "2015-'), Actual: e, Action: actionTaken, Description: 'Tag string'});
   }
    try {
    actionTaken = 'Nested';
    Parse.VariableGameNotationTagSection('[Date "2015"\n[EndDate "2016"]]');
    testResults.push(catchFailed(actionTaken, 'Failed to throw with Tags.'));
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('Illegal character found in tag:\n[Date "2015"\n['), Actual: e, Action: actionTaken, Description: 'Tags'});
   }
    try {
    actionTaken = 'Multiple';
    Parse.VariableGameNotationTagSection('[Date "2015" "Sep"]');
    testResults.push(catchFailed(actionTaken, 'Failed to throw with Tag strings.'));
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('A tag can\'t contain more than 1 string:\n[Date "2015" "'), Actual: e, Action: actionTaken, Description: 'Tag strings'});
   }
    try {
    actionTaken = 'Multiple';
    Parse.VariableGameNotationTagSection('[End Date "2015"]');
    testResults.push(catchFailed(actionTaken, 'Failed to throw with Tag names: space.'));
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('A tag can\'t contain more than 1 name:\n[End D'), Actual: e, Action: actionTaken, Description: 'Tag names: space'});
   }
    try {
    actionTaken = 'Multiple';
    Parse.VariableGameNotationTagSection('[End{}Date "2015"]');
    testResults.push(catchFailed(actionTaken, 'Failed to throw with Tag names: comment.'));
    }
   catch(e)
   {
       testResults.push({Expected: new SyntaxError('A tag name must be followed by white space:\n[End{'), Actual: e, Action: actionTaken, Description: 'Tag names: comment'});
   }
    try {
    actionTaken = 'Unsupported';
    Parse.VariableGameNotationTagSection('[GameFormat "PSG:Fake"]');
    testResults.push(catchFailed(actionTaken, 'Failed to throw with GameFormat: Text.'));
    }
   catch(e)
   {
       testResults.push({Expected: new Error('GameFormat PSG:Fake is not supported.'), Actual: e, Action: actionTaken, Description: 'GameFormat: Text'});
   }
    try {
    actionTaken = 'Unsupported';
    Parse.VariableGameNotationTagSection('[MoveFormat "BCCF"][GameFormat "VGN"]');
    testResults.push(catchFailed(actionTaken, 'Failed to throw with GameFormat: Binary.'));
    }
   catch(e)
   {
       testResults.push({Expected: new Error('GameFormat PGN is not supported.'), Actual: e, Action: actionTaken, Description: 'GameFormat: Binary'});
   }

    TesterUtility.displayResults('Tester.parsers.VariableGameNotationTagSection.errors', testResults, isFirst);
};
Tester.parsers.VariableGameNotationTagSection.happy=function(isFirst)
{
    TesterUtility.clearResults(isFirst);

    var testResults=[];
    var actionTaken, expected;

    try{
    actionTaken='Simple';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'MCN', Date: '2015'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][MoveFormat "MCN"][Date "2015"] Move Text')), Action: actionTaken, Description: 'Text'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Simple';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'BCCF'}, moveTextSection: '[Date "2015"]{ Move Text', isBinary: true};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][MoveFormat "BCCF"][Date "2015"]{ Move Text')), Action: actionTaken, Description: 'Binary'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Escaped';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN', Black: 'Mario "Jumpman" Mario'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][Black "Mario \\"Jumpman\\" Mario"]Move Text')), Action: actionTaken, Description: 'Tag String: quote'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Escaped';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN', OsFolder: 'C:\\Windows'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][OsFolder "C:\\\\Windows"]Move Text')), Action: actionTaken, Description: 'Tag String: backslash'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Escaped';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN', SaveToFolder: '\\\\NetworkFolder'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][SaveToFolder "\\\\\\\\NetworkFolder"]Move Text')), Action: actionTaken, Description: 'Tag String: double backslash'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Escaped';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN', Black: 'Me'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"][Black "\\Me"]Move Text')), Action: actionTaken, Description: 'Tag String: other'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Line comment';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('%Yo\n[GameFormat "VGN"]Move Text')), Action: actionTaken, Description: 'Useless Token %'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Line comment';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection(';Yo\r[GameFormat "VGN"]Move Text')), Action: actionTaken, Description: 'Old Mac End line'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Line comment';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection(';Yo\r\n[GameFormat "VGN"]Move Text')), Action: actionTaken, Description: 'Windows End line'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Line comment';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: '', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"];Yo')), Action: actionTaken, Description: 'Unended'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Ignore';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: 'Move Text', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('\n[\t  GameFormat\n"VGN"\t]\tMove Text')), Action: actionTaken, Description: 'White space'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    try{
    actionTaken='Ignore';
    expected = {allTags: {GameFormat: 'VGN', MoveFormat: 'SAN'}, moveTextSection: '', isBinary: false};
    testResults.push({Expected: JSON.stringify(expected), Actual: JSON.stringify(Parse.VariableGameNotationTagSection('[GameFormat "VGN"]')), Action: actionTaken, Description: 'Empty game'});
    } catch(e){testResults.push({Error: e, Action: actionTaken});}

    TesterUtility.displayResults('Tester.parsers.VariableGameNotationTagSection.happy', testResults, isFirst);
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
   Parse.VariableGameNotation: split into sub tests. have a test case show that a line comment is allowed to exist between last tag and white's move #
   Parse.VariableGameNotationMoveTextSection
   moveTextRegex[Parse.MinimumCoordinateNotationMove]
   Parse.FriendlyCoordinateNotationMove
   moveTextRegex[Parse.FriendlyCoordinateNotationMove]
   Parse.ShortenedFenRow
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

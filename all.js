var validationLevel = {off: {}, basic: {}, full: {}};  //enum
//off: assumes that moving an empty square is possible and other non-sense
//basic: only checks for things that are likely input errors.
    //to do this it checks some basic move legality but only the ones that are very unlikely to occur in a game
    //eg white can't move black's piece and a rook can't be promoted to a queen
//full: only allows the pieces to move legally. eg a rook can't move diagonally and you can't end your turn in check
    //if a game contains an illegal move (such as a knight moving to the wrong spot) then full validation can't be used

if(window.validation == null) window.validation = validationLevel.full;
if(validation !== validationLevel.off && validation !== validationLevel.basic && validation !== validationLevel.full)
    throw new Error('Invalid validation level: ' + validation);

//include everything else because I'm cool like that
var jsFileNamesUsed = ['core', 'parsers', 'util', 'writers'];
if(validation === validationLevel.full) jsFileNamesUsed = jsFileNamesUsed.concat(['movement', 'pieces']);
for(var i=0; i < jsFileNamesUsed.length; i++){includeJsFile(jsFileNamesUsed[i]);}
function includeJsFile(jsName)
{
    document.write('<script type="text/javascript" src="' + jsName + '.js"></script>');
    //document write is not a problem since this is ran only once
}

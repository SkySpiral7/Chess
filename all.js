var includeLevel = {basic: {}, validation: {}, san: {}};  //enum
if(window.include == null) window.include = includeLevel.validation;
if(include !== includeLevel.basic && include !== includeLevel.validation && include !== includeLevel.san)
    throw new Error('Invalid include level: ' + include);

//include everything else because I'm cool like that
//TODO: only include things based on include level
var jsFileNamesUsed = ['core', 'movement', 'parsers', 'pieces', 'util', 'writers'];
for(var i=0; i < jsFileNamesUsed.length; i++){includeJsFile(jsFileNamesUsed[i]);}
function includeJsFile(jsName)
{
    document.write('<script type="text/javascript" src="' + jsName + '.js"></script>');
    //document write is not a problem since this is ran only once
}

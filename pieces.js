function symbolToPiece(originalSymbol, source)
{
    var symbol = originalSymbol.toUpperCase();
    var isWhite = (symbol === originalSymbol);
   switch (symbol)
   {
       case 'R': return new Rook(source, isWhite);
       case 'N': return new Knight(source, isWhite);
       case 'B': return new Bishop(source, isWhite);
       case 'Q': return new Queen(source, isWhite);
       case 'K': return new King(source, isWhite);
       case 'P': return new Pawn(source, isWhite);
   }
    throw new Error('Invalid symbol: ' + originalSymbol);
}
/*
Interface for the pieces.
javascript can't have real interfaces because it would compile anyway.
function Piece(source, isWhite)
{
    /**Excludes destinations that are not on the board. Includes illegal moves such as capturing your own king.*
    this.getAllMoves = function(){return ['b7', 'g3']};
    this.toString = function(){return 'Black King on A5'};
    if(isWhite) this.symbol = 'P';
    else this.symbol = 'p';
}
*/
function Rook(source, isWhite)
{
    this.getAllMoves = function(){return []};
    this.toString = function(){return name;};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Rook on ' + source;

    this.symbol = 'R';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function Knight(source, isWhite)
{
    this.getAllMoves = function(){return []};
    this.toString = function(){return name;};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Knight on ' + source;

    this.symbol = 'N';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function Bishop(source, isWhite)
{
    this.getAllMoves = function(){return []};
    this.toString = function(){return name;};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Bishop on ' + source;

    this.symbol = 'B';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function Queen(source, isWhite)
{
    this.getAllMoves = function(){return []};
    this.toString = function(){return name;};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Queen on ' + source;

    this.symbol = 'Q';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function King(source, isWhite)
{
    this.getAllMoves = function(){return []};
    this.toString = function(){return name;};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'King on ' + source;

    this.symbol = 'K';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}
function Pawn(source, isWhite)
{
    this.getAllMoves = function(){return []};
    this.toString = function(){return name;};

    var name = 'Black ';
    if(isWhite) name = 'White ';
    name += 'Pawn on ' + source;

    this.symbol = 'P';
    if(!isWhite) this.symbol = this.symbol.toLowerCase();
}

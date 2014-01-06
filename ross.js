Function.prototype.partial = function(){
  var fn = this, args = Array.prototype.slice.call(arguments);
  return function(){
    var arg = 0;
    for ( var i = 0; i < args.length && arg < arguments.length; i++ )
      if ( args[i] === undefined )
        args[i] = arguments[arg++];
    return fn.apply(this, args);
  };
};

console.log(function() {
  var concat = Function.prototype.call.bind(String.prototype.concat);
  var append = function(what) { return concat.partial(undefined, what); };
  return append(':dev')('foo');
}());


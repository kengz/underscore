// high perf, R-like math lib implemented using lodash

var _ = require('lodash');
var m = require('mathjs');

var v = _.range(6);

var w = [0, 1, 2, 3, 4, 5];
// var w = [0, 1, 2, 3, 4, 5];
var x = [0, 1, 2, 3, 4, 5, w];
var z = [0, 1];
var z2 = [0, 1];

////////////////
// Module DEF //
////////////////
var u = {
    // concat all args and flattenDeep
    // trials: 50Mil
    // args, this-time / R-time
    // (1,1) 7.7 / 13.5
    // (0,1,2,3,4,5) 10.4 / 23.6
    // (v) 1.8 / 14.2
    // (v,v) 8.9 / 18.1
    // (v,v,v) 11.15 / 23.1
    c: function() {
        return arguments.length - 1 ?
            _.flattenDeep(_.toArray(arguments)) :
            arguments[0];
    },
    // helper for sum: takes in one array (can be nested)
    // (v) 1.1 / 18.1
    asum: function(v) {
        // trampolining for tail-call-optimization: prevent stack overflow
        function _asum(n, acc) {
            var len = n.length;
            while (len--) acc += n[len] instanceof Array ?
                _asum(n[len], 0) : n[len]
            return acc;
        };
        // actual function call; recurse if need to
        var total = 0,
            len = v.length;
        while (len--) total += (v[len] instanceof Array ?
            _asum(v[len], 0) : v[len])
        return total;
    },

    // sum all the arguments by deep-flattening this-time
    // Doesn't use _.flattenDeep(_.toArray(arguments)) cuz it's much slower
    // Each extra layer of array nest costs +2s for 50Mil runs
    // (0,1,2,3,4,5) 1.6 / 44.6
    // (v) 1.9 / 18.1
    // (0,1,2,3,4,5,v) 3.1 / 53.1
    // (v,v) 3.4 / 24.5
    // (v,v,v) 4.7 / 30.1
    // (v,v,v,v) 6.3 / 37
    sum: function() {
        var res = 0;
        var len = arguments.length;
        while (len--) res += (arguments[len] instanceof Array ?
            u.asum(arguments[len]) : arguments[len])
        return res;
    },

    // like _.range, but _.seq(N) = _.range(N)+1
    // (10) 3.0 / 5000 years
    seq: function(start, stop, step) {
        if (stop == null) {
            stop = start || 1;
            start = 1;
        }
        step = step || 1;
        var length = Math.max(Math.ceil((stop - start) / step), 0) + 1;
        var range = Array(length);
        for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }
        return range;
    },

    // functional backend: distribute and associate
    // assuming Y is array (nested)
    // (a_add, 1, v) 2.8 / 16.1
    // (a_add, 1, [v,v]) 7.4 / 23.8
    // (a_add, 1, [v,v,v]) 9.2 / 29.2
    // (a_add, 1, [v,v,v,v]) 10.8 / 29.5
    // (a_add, 1, [v,v,v,v,v,v,v]) 15.7 / 47.7
    distributeRight: function(fn, x, Y) {
        var len = Y.length,
            res = Array(len);
        while (len--) res[len] = Y[len] instanceof Array ?
            u.distributeRight(fn, x, Y[len]) : fn(x, Y[len])
        return res;
    },


    // assuming both arrays, repeat the shorter over the longer
    // call internally recur till can distribute right or just apply
    distributeBoth: function(fn, X, Y) {
        var Xlen = X.length,
            Ylen = Y.length;
        if (Xlen % Ylen == 0 || Ylen % Xlen == 0) {
            var L, S;
            if (Xlen > Ylen) {
                L = X;
                S = Y;
            } else {
                L = Y;
                S = X;
            }
            var Llen = L.length,
                Slen = S.length,
                res = Array(Llen);
            while (Llen--) res[Llen] = u.distribute(fn, S[Llen % Slen], L[Llen]);
            return res;
        } else throw "Cannot distribute arrays of different dimensions.";
    },
    // add a uniform distribute assump: once detect is not arr, all is not arr
    // add a uniform distribute assump: once detect is not arr, all is not arr
    // the true distribute method
    // (u.a_add,w,w) 7.5 / 16.4
    // This method is correct and at its fastest. But may rebuild specific multiplication/distribution methods later, which may be even faster
    distribute: function(fn, X, Y) {
        if (X instanceof Array)
            return Y instanceof Array ?
                 u.distributeBoth(fn, X, Y) : u.distributeRight(fn, Y, X);
        else
            return Y instanceof Array ?
                u.distributeRight(fn, X, Y) : fn(X, Y);
    },

    // (u.a_add,w,w) 8.5 / 16.4
    // rawArgs is the arguments from the higher function (can be arr too)
    asso: function(fn, rawArgs) {
        var len = rawArgs.length,
            // optimize arg form baed on length or rawargs
            args = len < 3 ? rawArgs : _.toArray(rawArgs),
            res = u.distribute(fn, args[--len], args[--len]);
        while (len--) res = u.distribute(fn, res, args[len]);
        return res;
    },


    // the atomic add (for non-arrays) for the generic method.
    a_add: function(x, y) {
        return x + y;
    },
    // the generic add
    // (v,1) 5.7 / 15.7 aim for 3?
    // (v,v) 8.6 / 16.4 aim for 3s
    // (v,v,v) 18.9 / 25.3 aim for 6s
    // (v,v,v,v) 25.1 / 33.9
    // (v,v,v,v,v) 33.4 / 42.2
    // (v,1,2,3,4,5,6,7,8,9,0) 17.3 / 76.8
    add: function() {
        // sample call pattern: pass whole args
        return u.asso(u.a_add, arguments);
    },

    // atomic minus
    a_subtract: function(x, y) {
        return x - y;
    },
    subtract: function() {
        return u.asso(u.a_subtract, arguments);
    },

    a_multiply: function(x, y) {
        return x * y;
    },
    multiply: function() {
        return u.asso(u.a_multiply, arguments);
    },

    a_divide: function(x, y) {
        return x / y;
    },
    divide: function() {
        return u.asso(u.a_divide, arguments);
    },

    // (v,v) 10.9
    dot: function(X, Y) {
        return _.sum(u.multiply(X, Y));
    }

    // Need data dimension transformer
    // Need data dimension transformer
    // Need data dimension transformer
    // Need data dimension transformer
    // Need data dimension transformer
    // Need data dimension transformer

}


// console.log(u.add(1, [z,z]));
// console.log(z);
console.log(v);
console.log([[0,1], [2,3], [4,5]]);

function benchmark() {
    var MAX = 50000000;
    var start = new Date().getTime();
    while (MAX--) {
    	// _.flattenDeep(v); //3.6
    	// _.flattenDeep([v,v]);
    }
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time: ' + time / 1000, 'seconds');
}

benchmark();

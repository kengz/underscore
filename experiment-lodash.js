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
    // (b_add, 1, v) 2.8 / 16.1
    // (b_add, 1, [v,v]) 7.4 / 23.8
    // (b_add, 1, [v,v,v]) 9.2 / 29.2
    // (b_add, 1, [v,v,v,v]) 10.8 / 29.5
    // (b_add, 1, [v,v,v,v,v,v,v]) 15.7 / 47.7
    distributeRight: function(fnn, xx, YY) {
        // trampolining for stackoverflow protection
        function _distributeRight(fn, x, Y) {
            var len = Y.length,
                res = Array(len);
            while (len--) res[len] = Y[len] instanceof Array ?
                u.distributeRight(x, Y[len]) : fn(x, Y[len])
            return res;
        }
        return _distributeRight(fnn, xx, YY)
    },
    // assuming both arrays, repeat the shorter over the longer
    // call internally recur till can distribute right or just apply
    distributeBoth: function(fn, X, Y) {
        var L, S;
        if (X.length > Y.length) {
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
    },
    // the true distribute method
    distribute: function(fn, X, Y) {
        if (X instanceof Array)
            return Y instanceof Array ?
                u.distributeBoth(fn, X, Y) : u.distributeRight(fn, Y, X);
        else
            return Y instanceof Array ?
                u.distributeRight(fn, X, Y) : fn(X, Y);
    },

    asso: function() {
        var len = arguments.length,
            fn = arguments[0],
            res = arguments[--len];
        while (--len) res = u.distribute(fn, res, arguments[len]);
        return res;
    },

    b_add: function(x, y) {
        return x + y;
    },

    add: function() {

    },
}

console.log(u.asso(u.b_add, v, z, 10))
    // console.log(u.distributeRight(u.b_add, 1, [v,v]));
    // console.log(u.distributeBoth(u.b_add, 1, v));
    // console.log(u.distributeBoth(u.b_add, z, v));
    // console.log(u.distribute(u.b_add, v, v));
    // console.log(u.distribute(u.b_add, z, v));
    // console.log(u.distributeBoth(u.b_add, v, z));
    // console.log(v);
    // console.log(u.distribute(u.b_add, v, 1))
    // console.log(u.distribute(u.b_add, v, v))
    // console.log(!(6 % 3))
var num = 1;
// console.log(arr instanceof Array);
function benchmark() {
    var v = [];
    var MAX = 50000000;
    var start = new Date().getTime();
    while (MAX--) {
        // u.asso(u.b_add, w, z)
        // u.distributeRight(u.b_add, 1, v) // 2.7
        u.distribute(u.b_add, w, z) // 6.7
            // u.distribute(u.b_add, z, v) //3.3 with net
            // u.distribute(u.b_add, z, v) //3.3 with net
            // u.distributeBoth(u.b_add, z, u.distributeBoth(u.b_add, z2, w))
    }
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time: ' + time / 1000, 'seconds');
}

benchmark();

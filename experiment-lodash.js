// high perf, R-like math lib implemented using lodash

var _ = require('lodash');
// var _ = require('underscore');
var m = require('mathjs');

var h = require(__dirname + '/helper.js').h;

// cbind
// random then distribution
// Regex
// general structure transformation
// log exp
// subsetting, combination
// init array to dim all 0
// logical
// index summation

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

    //////////////////////////////
    // Function builder backend //
    //////////////////////////////

    // Helper: distribute scalar x over tensor Y
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

    // distribute tensor X over Y: pair up terms at the same depth at same index position; repeat if one is shorter at a level.
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
    // Generic-distribute any tensor X over Y, if dimensions match up (or the longer is a multiple of the shorter, repeat shorter)
    // uses recursion, thus assumes data set is not too deeply nested
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
    // Associate: assuming arguments are non-arrays.
    // argObj is the arguments from the higher function (can be arr too)
    asso: function(fn, argObj) {
        var len = argObj.length,
            // optimize arg form baed on length or argObj
            args = len < 3 ? argObj : _.toArray(argObj),
            res = fn(args[--len], args[--len]);
        while (len--) res = fn(res, args[len]);
        return res;
    },

    // associate with distribute. Useful, fast shortcut
    assodist: function(fn, argObj) {
        var len = argObj.length,
            // optimize arg form baed on length or argObj
            args = len < 3 ? argObj : _.toArray(argObj),
            res = u.distribute(fn, args[--len], args[--len]);
        while (len--) res = u.distribute(fn, res, args[len]);
        return res;
    },


    // Future:
    // cross and wedge, need index summation too


    //////////////////////////////
    // Basic arithmetic methods //
    //////////////////////////////


    // concat all args and flattenDeep
    // trials: 50Mil
    // args, this-time / R-time
    // (1,1) 7.7 / 13.5
    // (0,1,2,3,4,5) 10.4 / 23.6
    // (v) 1.8 / 14.2
    // (v,v) 8.9 / 18.1
    // (v,v,v) 11.15 / 23.1
    c: function() {
        return _.flattenDeep(_.toArray(arguments));
    },
    // atomic for sum: takes in one array (can be nested)
    // (v) 1.1 / 18.1
    a_sum: function(v) {
        // actual function call; recurse if need to
        var total = 0,
            len = v.length;
        while (len--) total += (v[len] instanceof Array ?
            u.a_sum(v[len], 0) : v[len])
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
            u.a_sum(arguments[len]) : arguments[len])
        return res;
    },
    // atomic for prod
    a_prod: function(v) {
        // actual function call; recurse if need to
        var total = 1,
            len = v.length;
        while (len--) total *= (v[len] instanceof Array ?
            u.a_prod(v[len], 1) : v[len])
        return total;
    },
    // take product by collapsing args. Like sum
    prod: function() {
        var res = 1;
        var len = arguments.length;
        while (len--) res *= (arguments[len] instanceof Array ?
            u.a_prod(arguments[len]) : arguments[len])
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
        return u.assodist(u.a_add, arguments);
    },
    // atomic minus
    a_subtract: function(x, y) {
        return x - y;
    },
    subtract: function() {
        return u.assodist(u.a_subtract, arguments);
    },

    a_multiply: function(x, y) {
        return x * y;
    },
    multiply: function() {
        return u.assodist(u.a_multiply, arguments);
    },

    a_divide: function(x, y) {
        return x / y;
    },
    divide: function() {
        return u.assodist(u.a_divide, arguments);
    },


    ////////////////////////////
    // Basic Tensor functions //
    ////////////////////////////

    // get the depth of array M; assuming homogen tensor
    depth: function(M) {
        var m = M,
            d = 0;
        while (m.length) {
            d += m.length;
            m = m[0];
        }
        return d;
    },

    // get the size of a tensor (by flattenDeep)
    size: function(M) {
        return _.flattenDeep(M).length;
    },

    // Get the dimension of a tensor, assume rectangular
    dim: function(T) {
        var dim = [],
            ptr = T;
        while (ptr.length) {
            dim.push(ptr.length);
            ptr = ptr[0];
        }
        return dim;
    },
    // check if a tensor is rank-1
    isFlat: function(T) {
        var flat = true,
            len = T.length;
        while (len--) {
            flat *= !(T[len] instanceof Array);
            if (!flat) break;
        }
        return flat;
    },


    ///////////////////////////
    // Tensor transformation //
    ///////////////////////////

    // lodash methods
    // _.chunk
    // _.flatten, _.flattenDeep
    // union, intersection, difference, xor

    // Array creation

    // rewrite using lodash range +1
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

    // return an array of length N initialized to val (0 if not specified)
    numeric: function(N, val) {
        return val == undefined ? _.fill(Array(N), 0) : _.fill(Array(N), val);
    },

    // use chunk from inside to outside:
    reshape: function(arr, dimArr) {
        var tensor = arr;
        var len = dimArr.length;
        while (--len)
            tensor = _.chunk(tensor, dimArr[len]);
        return tensor;
    },
    // return a copy with sub rows from matrix M
    rbind: function(M, indArr) {
        return _.map(indArr, function(i) {
            return _.cloneDeep(M[i])
        });
    },
    // return a copy with sub rows from matrix M 
    cbind: function(M, indArr) {
        return _.map(M, function(row) {
            return _.map(indArr, function(i) {
                return row[i];
            });
        });
    },

    // swap between rows and columns. Need be rectangular
    transpose: function(M) {
        return _.zip.apply(null, M);
    },

    // transpose
    // cbind

    // change terminologies: V vector, M matrix, T tensor



    // More functions

    // (v,v) 10.9
    dot: function(X, Y) {
        return _.sum(u.multiply(X, Y));
    },

    // Need data dimension transformer
    // Need data dimension transformer
    // Need data dimension transformer
    // Need data dimension transformer
    // Need data dimension transformer
    // Need data dimension transformer


    // Properties

    ////////////////
    // error logs //
    ////////////////

    // need generic error message to check

    // remove all recursions
    // remove all recursions
    // remove all recursions
    // remove all recursions
    // remove all recursions
}

// push to stack, then reshape
var mm = [v, v, v];
// var qq = mm.slice(0);
var qq = _.cloneDeep(mm);
qq[0][0] = -1;
console.log(mm)
// console.log(u.cbind(mm,[1,2,3]))
console.log(u.transpose(mm));
    // u.add(1,v)



// var vv = _.range(24);
function benchmark() {
    var MAX = 5000000;
    var start = new Date().getTime();
    // mydistright(u.a_add, 1, m);
    while (MAX--) {
        // u.cbind(mm,[1,2,3])
        // v.slice(0);
        // _.cloneDeep(v)
        // m.sum(v)
        // u.prod(vv)
        // u.c(1,1)
        // v instanceof Array;
        // _.isArray(v)
    }
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time: ' + time / 1000, 'seconds');
}

benchmark();

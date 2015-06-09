// high perf, R-like math lib implemented using lodash

var _ = require('lodash');
// var _ = require('underscore');
var m = require('mathjs');

// cbind
// random then distribution
// Regex
// ~general structure transformation
// ~log exp
// ~subsetting, combination
// ~init array to dim all 0
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
var _m = {

    //////////////////////////////
    // Function builder backend //
    //////////////////////////////

    // We employ clearer terminologies to distinguish the "depth" or the "dimension" of the objects. In general, we call generic array of depth-N a "N-tensor" or "rank-N tensor". A scalar is "0-tensor"; a simple array/vector is "1-tensor", matrix (array of arrays) is "2-tensor", and so on.
    // A generic function that operates over tensor is built from an atomic function fn taking two scalar arguments. 
    // Applying a function into depths of tensor is done via distribution, and evaluating a multi-argument function is done via associativity.

    // distribute a unary function over every scalar in tensor Y;
    distributeSingle: function(fn, Y) {
        if (!(Y instanceof Array)) return fn(Y);
        var len = Y.length,
            res = Array(len);
        while (len--) res[len] = Y[len] instanceof Array ?
            _m.distributeSingle(fn, Y[len]) : fn(Y[len])
        return res;
    },
    // Distribute fn with left scalar x over right tensor Y.
    distributeRight: function(fn, x, Y) {
        var len = Y.length,
            res = Array(len);
        while (len--) res[len] = Y[len] instanceof Array ?
            _m.distributeRight(fn, x, Y[len]) : fn(x, Y[len])
        return res;
    },
    // Distribute fn with left tensor X over right scalar y.
    distributeLeft: function(fn, X, y) {
        var len = X.length,
            res = Array(len);
        while (len--) res[len] = X[len] instanceof Array ?
            _m.distributeLeft(fn, X[len], y) : fn(X[len], y)
        return res;
    },

    // Distribute fn between non-scalar tensors X, Y: pair them up term-wise and calling distribute recursively.
    // If at any depth X and Y have different lengths, recycle if the mod of lengths is 0.
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
            while (Llen--) res[Llen] = _m.distribute(fn, S[Llen % Slen], L[Llen]);
            return res;
        } else throw "Cannot distribute arrays of different dimensions.";
    },
    // Generic Distribute: Distribute fn between left tensor X and right tensor Y, while preserving the argument-ordering (vital for non-commutative functions). 
    // This pairs up the tensors term-wise while descending down the depths recursively, until finding a scalar to distributeLeft/Right.
    // Method is at its fastest, and assuming the data depth isn't too deep (otherwise JS will have troubles with it)
    distribute: function(fn, X, Y) {
        if (X instanceof Array)
            return Y instanceof Array ?
                _m.distributeBoth(fn, X, Y) : _m.distributeLeft(fn, X, Y);
        else
            return Y instanceof Array ?
                _m.distributeRight(fn, X, Y) : fn(X, Y);
    },

    // Generic associate: take the arguments object or array and apply atomic fn (non-tensor) from left to right
    asso: function(fn, argObj) {
        var len = argObj.length,
            i = 0;
        // optimize arg form based on length or argObj
        var args = len < 3 ? argObj : _.toArray(argObj),
            res = fn(args[i++], args[i++]);
        while (i < len) res = fn(res, args[i++]);
        return res;
    },

    // Associate with distributivity: Similar to asso but is for tensor functions; apply atomic fn distributively from left to right.
    // Usage: for applying fn on tensors element-wise if they have matching dimensions.
    assodist: function(fn, argObj) {
        var len = argObj.length,
            i = 0;
        // optimize arg form based on length or argObj
        var args = len < 3 ? argObj : _.toArray(argObj),
            res = _m.distribute(fn, args[i++], args[i++]);
        while (i < len) res = _m.distribute(fn, res, args[i++]);
        return res;
    },

    // Future:
    // Future:
    // Future:
    // cross and wedge, need index summation too, matrix mult.


    /////////////////////
    // Basic functions //
    /////////////////////

    // Concat all arguments into single vector by _.flattenDeep
    c: function() {
        return _.flattenDeep(_.toArray(arguments));
    },
    // atomic sum: takes in a tensor (any rank) and sum all values
    a_sum: function(T) {
        // actual function call; recurse if need to
        var total = 0,
            len = T.length;
        while (len--) total += (T[len] instanceof Array ?
            _m.a_sum(T[len], 0) : T[len])
        return total;
    },
    // sum all values in all arguments
    sum: function() {
        var res = 0;
        var len = arguments.length;
        while (len--) res += (arguments[len] instanceof Array ?
            _m.a_sum(arguments[len]) : arguments[len])
        return res;
    },
    // atomic prod, analogue to a_sum. Multiply all values in a tensor
    a_prod: function(T) {
        // actual function call; recurse if need to
        var total = 1,
            len = T.length;
        while (len--) total *= (T[len] instanceof Array ?
            _m.a_prod(T[len], 1) : T[len])
        return total;
    },
    // product of all values in all arguments
    prod: function() {
        var res = 1,
            len = arguments.length;
        while (len--) res *= (arguments[len] instanceof Array ?
            _m.a_prod(arguments[len]) : arguments[len])
        return res;
    },

    // atomic add: add two scalars x, y.
    a_add: function(x, y) {
        return x + y;
    },
    // add all tensor arguments element-wise/distributively and associatively
    add: function() {
        // sample call pattern: pass whole args
        return _m.assodist(_m.a_add, arguments);
    },
    // atomic subtract
    a_subtract: function(x, y) {
        return x - y;
    },
    // subtract all tensor arguments element-wise/distributively and associatively
    subtract: function() {
        return _m.assodist(_m.a_subtract, arguments);
    },
    // atomic multiply
    a_multiply: function(x, y) {
        return x * y;
    },
    // multiply all tensor arguments element-wise/distributively and associatively
    // Note: This is generic; is different from matrix multiplication
    multiply: function() {
        return _m.assodist(_m.a_multiply, arguments);
    },
    // atomic divide
    a_divide: function(x, y) {
        return x / y;
    },
    // divide all tensor arguments element-wise/distributively and associatively
    divide: function() {
        return _m.assodist(_m.a_divide, arguments);
    },
    // atomic log. Use base e by default
    a_log: function(x, base) {
        return base == undefined ? Math.log(x) : Math.log(x) / Math.log(base);
    },
    // take the log of tensor T to the n element-wise
    log: function(T, base) {
        return _m.distribute(_m.a_log, T, base);
    },
    // atomic square
    a_square: function(x) {
        return x * x;
    },
    square: function(T) {
        return _m.distributeSingle(_m.a_square, T);
    },
    // atomic root
    a_root: function(x, n) {
        return n % 2 ?
            // if odd power
            Math.sign(x) * Math.pow(Math.abs(x), 1 / n) :
            Math.pow(x, 1 / n);
    },
    // take the n-th root of tensor T element-wise
    root: function(T, n) {
        return _m.distribute(_m.a_root, T, n);
    },


    ////////////////////
    // Basic checkers //
    ////////////////////
    
    // check if x is an integer
    isInteger: function(x) {
        return x == Math.floor(x);
    },
    // check if x is a double
    isDouble: function(x) {
        return x != Math.floor(x);
    },
    // check if x is positive
    isPositive: function(x) {
        return x > 0;
    },
    // check if x less than or eq to 0
    nonPositive: function(x) {
        return !(x > 0);
    },
    // check if x is negative
    isNegative: function(x) {
        return x < 0;
    },
    // check if x greater than or eq to 0
    nonNegative: function(x) {
        return !(x < 0);
    },
    nonZero: function(x) {
        return x != 0;
    },


    //////////////////////////////////////////
    // Unary functions from JS Math object, //
    //////////////////////////////////////////
    // wrapped to function with generic tensor

    abs: function(T) {
        return _m.distributeSingle(Math.abs, T);
    },
    acos: function(T) {
        return _m.distributeSingle(Math.acos, T);
    },
    acosh: function(T) {
        return _m.distributeSingle(Math.acosh, T);
    },
    asin: function(T) {
        return _m.distributeSingle(Math.asin, T);
    },
    asinh: function(T) {
        return _m.distributeSingle(Math.asinh, T);
    },
    atan: function(T) {
        return _m.distributeSingle(Math.atan, T);
    },
    atanh: function(T) {
        return _m.distributeSingle(Math.atanh, T);
    },
    ceil: function(T) {
        return _m.distributeSingle(Math.ceil, T);
    },
    cos: function(T) {
        return _m.distributeSingle(Math.cos, T);
    },
    cosh: function(T) {
        return _m.distributeSingle(Math.cosh, T);
    },
    exp: function(T) {
        return _m.distributeSingle(Math.exp, T);
    },
    floor: function(T) {
        return _m.distributeSingle(Math.floor, T);
    },
    log10: function(T) {
        return _m.distributeSingle(Math.log10, T);
    },
    log1p: function(T) {
        return _m.distributeSingle(Math.log1p, T);
    },
    log2: function(T) {
        return _m.distributeSingle(Math.log2, T);
    },
    round: function(T) {
        return _m.distributeSingle(Math.round, T);
    },
    pow: function(T, n) {
        return _m.distribute(Math.pow, T, n);
    },
    sign: function(T) {
        return _m.distributeSingle(Math.sign, T);
    },
    sin: function(T) {
        return _m.distributeSingle(Math.sin, T);
    },
    sinh: function(T) {
        return _m.distributeSingle(Math.sinh, T);
    },
    sqrt: function(T) {
        return _m.distributeSingle(Math.sqrt, T);
    },
    tan: function(T) {
        return _m.distributeSingle(Math.tan, T);
    },
    tanh: function(T) {
        return _m.distributeSingle(Math.tanh, T);
    },
    trunc: function(T) {
        return _m.distributeSingle(Math.trunc, T);
    },



    /////////////////////
    // Regex functions //
    /////////////////////

    // return a function that matches regex,
    // e.g. matchRegex(/red/)('red Apple') returns true
    reMatch: function(regex) {
        return function(str) {
            if (str != undefined)
                return str.search(regex) != -1;
        }
    },
    // negation of reMatch
    reNotMatch: function(regex) {
        return function(str) {
            if (str != undefined)
                return str.search(regex) == -1;
        }
    },
    // return the string matched by regex
    reGet: function(regex) {
        return function(str) {
            if (str != undefined)
                return str.match(regex)[0];
        }
    },
    // return a single regex as the "AND" of all arg regex's
    reAnd: function() {
        function wrap(reg) {
            return '(?=.*' + reg.replace(/\//g, '') + ')'
        };
        return new RegExp(_.map(_.toArray(arguments), wrap).join(''));
    },
    // return a function that matches all(AND) of the regexs
    reAndMatch: function() {
        return _m.reMatch(_m.reAnd.apply(null, arguments));
    },
    // return a single regex as the "OR" of all arg regex's
    reOr: function() {
        function wrap(reg) {
            return '(?=.*' + reg.replace(/\//g, '') + ')'
        };
        return new RegExp(_.map(_.toArray(arguments), wrap).join('|'));
    },
    // return a function that matches at least one(OR) of the regexs
    reOrMatch: function() {
        return _m.reMatch(_m.reOr.apply(null, arguments));
    },


    ////////////////////
    // Array creation //
    ////////////////////

    // union, intersection, difference, xor

    // seq from R: like _.range, but starts with 1 by default
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

    // return an array of length N initialized to val (default to 0)
    numeric: function(N, val) {
        return val == undefined ? _.fill(Array(N), 0) : _.fill(Array(N), val);
    },


    ///////////////////////
    // Tensor properties //
    ///////////////////////

    // Note that a tensor has homogenous depth, that is, there cannot tensors of different ranks in the same vector, e.g. [1, [2,3], 4] is prohibited.

    // return the depth (rank) of tensor, assuming homogeneity
    depth: function(T) {
        var t = T,
            d = 0;
        while (t.length) {
            d += t.length;
            t = t[0];
        }
        return d;
    },

    // return the size of a tensor (total number of scalar entries)
    size: function(T) {
        return _.flattenDeep(T).length;
    },

    // Get the dimension of a tensor by _.flattenDeep, assume rectangular
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


    // get the maximum length of the deepest array in tensor T.
    maxDeepestLength: function(T) {
        var stack = [],
            sizes = [];
        stack.push(T);
        while (stack.length) {
            var curr = stack.pop(),
                len = curr.length;
            if (_m.isFlat(curr))
                sizes.push(len);
            else
                while (len--)
                    stack.push(curr[len]);
        }
        return _.max(sizes);
    },


    ///////////////////////////
    // Tensor transformation //
    ///////////////////////////

    // lodash methods
    // _.chunk
    // _.flatten, _.flattenDeep

    // swap at index i, j
    // mutates the array
    swap: function(arr, i, j) {
        arr[i] = arr.splice(j, 1, arr[i])[0];
        return arr;
    },

    // reverse arr from index k to l inclusive
    // mutates the array
    reverse: function(arr, k, l) {
        var i = k == undefined ? 0 : k;
        var j = l == undefined ? arr.length - 1 : l;
        var mid = Math.ceil((i + j) / 2);
        while (i < mid)
            _m.swap(arr, i++, j--);
        return arr;
    },

    // extend an array till toLen, filled with val defaulted to 0.
    extendArray: function(arr, val, toLen) {
        var lendiff = toLen - arr.length,
            repVal = val == undefined ? 0 : val;
        if (lendiff < 0)
            throw "Array longer than the length to extend to"
        while (lendiff--)
            arr.push(repVal);
        return arr;
    },
    // applying _.indexOf in batch
    batchIndexOf: function(arr, fieldArr) {
        return _.map(fieldArr, function(t) {
            return _.indexOf(arr, t)
        });
    },
    // Assuming matrix has header, rbind by header fields instead of indices
    rbindByField: function(M, fieldArr) {
        // assuming header is first row of matrix
        var header = M[0],
        fieldInds = _m.batchIndexOf(header, fieldArr);
        return _m.rbind(M, fieldInds);
    },
    // return a copy with sub rows from matrix M
    rbind: function(M, indArr) {
        return _.map(indArr, function(i) {
            return _.cloneDeep(M[i]);
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
    // transpose a matrix
    transpose: function(M) {
        return _.zip.apply(null, M);
    },
    // make a tensor rectangular by filling with val, defaulted to 0.
    // mutates the tensor.
    rectangularize: function(T, val) {
        var toLen = _m.maxDeepestLength(T),
            stack = [];
        stack.push(T);
        while (stack.length) {
            var curr = stack.pop();
            if (_m.isFlat(curr))
                _m.extendArray(curr, val, toLen);
            else
                _.each(curr, function(c) {
                    stack.push(c);
                })
        }
        return T;
    },
    // use chunk from inside to outside:
    reshape: function(arr, dimArr) {
        var tensor = arr;
        var len = dimArr.length;
        while (--len)
            tensor = _.chunk(tensor, dimArr[len]);
        return tensor;
    },



    ///////////////////////////////
    // Subsets and combinatorics //
    ///////////////////////////////

    // generate n-nary number of length
    genAry: function(length, n) {
        var range = _.map(_.range(n), String);
        var tmp = range,
            it = length;
        while (--it) {
            tmp = _.flattenDeep(_.map(range, function(x) {
                return _m.distributeRight(_m.a_add, x, tmp)
            }));
        }
        return tmp;
    },

    // convert array of strings to array of array of numbers
    toNumArr: function(sarr) {
        return _.map(sarr, function(str) {
            return _.map(str.split(''), function(x) {
                return parseInt(x);
            })
        })
    },

    // generate all permutation subset indices of n items
    pSubset: function(n) {
        var range = _.map(_.range(n), String),
            res = [],
            count = n;
        res.push(range); //init
        while (--count) {
            // the last batch to expand on
            var last = _.last(res);
            var batch = [];
            _.each(last, function(k) {
                for (var i = 0; i < n; i++)
                    if (!_.contains(k.split(''), String(i)))
                        batch.push(k + i);
            })
            res.push(batch);
        }
        return res;
    },

    // generate all subset indices of n items
    subset: function(n) {
        var range = _.map(_.range(n), String),
            res = [],
            count = n;
        res.push(range); //init
        while (--count) {
            // the last batch to expand on
            var last = _.last(res);
            var batch = [];
            _.each(last, function(k) {
                for (var i = Number(_.last(k)) + 1; i < n; i++)
                    batch.push(k + i);
            })
            res.push(batch);
        }
        return res;
    },

    // generate the indices of n-perm-r
    permList: function(n, r) {
        return _m.toNumArr(_m.pSubset(n)[r - 1]);
    },
    // generate the indices of n-choose-r
    combList: function(n, r) {
        return _m.toNumArr(_m.subset(n)[r - 1]);
    },

    // generate all permutations of n items
    permute: function(n) {
        var range = _.range(n),
            res = [],
            diffs, k = 0;
        while (k != -1) {
            res.push(range.slice(0));
            diffs = _m.stairs(range),
                k = _.findLastIndex(diffs, _m.isPositive);
            var l = _.findLastIndex(range, function(t) {
                return t > range[k];
            });
            _m.swap(range, k, l);
            _m.reverse(range, k + 1, null);
        }
        return res;
    },

    // return factorial(n)
    // alias: fact
    factorial: function(n) {
        var count = n,
            res = n;
        while (--count)
            res *= count;
        return res;
    },
    // return n-permute-r
    // alias: perm
    permutation: function(n, r) {
        var count = r,
            term = n;
        res = n;
        while (--count)
            res *= --term;
        return res;
    },
    // return n-choose-r
    // alias: comb
    combination: function(n, r) {
        return _m.permutation(n, r) / _m.factorial(r);
    },


    /////////////////////
    // Handy vectorial //
    /////////////////////

    // return the dot product of two vectors
    dot: function(X, Y) {
        return _.sum(_m.multiply(X, Y));
    },
    // return the sum of n-powers of a tensor, default to n = 2
    powSum: function(T, n) {
        var L = n == undefined ? 2 : n;
        return _.sum(_m.pow(T, L));
    },
    // return the L-n norm of a vector, default to L-2
    norm: function(v, n) {
        var L = n == undefined ? 2 : n;
        return _m.a_root(_m.powSum(v, L), L);
    },
    // normalize a vector(tensor) by L-n norm, default to n=2
    normalize: function(v, n) {
        return _m.divide(v, _m.norm(v, n));
    },
    // rescale a vector to unit length
    rescale: function(v) {
        return _m.normalize(v, 1);
    },


    //////////////////
    // handy Matrix //
    //////////////////

    // Matrix ops
    // Matrix ops
    // Matrix ops


    /////////////////
    // Handy trend //
    /////////////////

    // return the stairs: adjacent difference in a vector
    stairs: function(v) {
        var dlen = v.length - 1,
            st = Array(dlen);
        while (dlen--)
            st[dlen] = v[dlen + 1] - v[dlen];
        return st;
    },


    // check if all tensor entries are of the same sign, with the specified sign function
    sameSign: function(T, signFn) {
        return Boolean(_m.prod(_m.distributeSingle(signFn, T)));
    },

    // check the trend of vector v using sign-function
    stairsTrend: function(v, signFn) {
        return _m.sameSign(_m.stairs(v), signFn);
    },
    // check if vector v is increasing
    increasing: function(v) {
        return _m.stairsTrend(v, _m.isPositive);
    },
    // check is vector v is non-decreasing
    nonDecreasing: function(v) {
        return _m.stairsTrend(v, _m.nonNegative);
    },
    // check is vector v is decreasing
    decreasing: function(v) {
        return _m.stairsTrend(v, _m.isNegative);
    },
    // check is vector v is non-increasing
    nonIncreasing: function(v) {
        return _m.stairsTrend(v, _m.nonPositive);
    },


    ///////////////////////
    // Handy statistical //
    ///////////////////////


    // return the average of a vector
    mean: function(v) {
        return _.sum(v) / v.length;
    },

    // return the expectation value E(fn(x)), given probability and value vectors, and an optional atomic fn, defaulted to identity E(x).
    // Note: fn must be atomic
    // alias E
    expVal: function(pV, xV, fn) {
        if (fn != undefined)
            return _m.dot(pV, _m.distributeSingle(fn, xV));
        return _m.dot(pV, xV);
    },
    // return the variance, given probability and value vectors
    // alias Var
    variance: function(pV, xV) {
        return _m.expVal(pV, xV, _m.a_square) - _m.a_square(_m.expVal(pV, xV));
    },
    // return the variance, given probability and value vectors
    stdev: function(pV, xV) {
        return Math.sqrt(_m.variance(pV, xV));
    },



    // Calculate the rate of return r in % of an exp growth, given final value m_f, initial value m_i, and time interval t
    expGRate: function(m_f, m_i, t) {
        return 100 * (Math.exp(Math.log(m_f / m_i) / t) - 1);
    },
    // Calculate the trailing exp rate of return in the last t years given a vector v
    trailExpGRate: function(v, t) {
        var len = arr.length;
        return _m.expRate(v[len - 1], v[len - 1 - t], t);
    },


    ////////////////
    // error logs //
    ////////////////

    // need generic error message to check
}

// var pV = _m.normalize(v, 1);
// var pV = [0.2,0.2,0.2,0.2,0.2,0.2]
// console.log(pV);
// console.log(_m.expVal(pV, v))
// console.log(_m.variance(pV, v))

console.log(_.keys(_m));
console.log(_.keys(_m).length);
console.log(_m.reGet(/ab/)('abcd'));

var mm = [
    [1, 2],
    [3, 4, 2]
]


// var vv = _.range(24);
function benchmark() {
    var MAX = 50000000;
    var start = new Date().getTime();
    while (MAX--) {

    }
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time: ' + time / 1000, 'seconds');
}

benchmark();

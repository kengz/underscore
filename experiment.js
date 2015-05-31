(function() {
    var _ = typeof require == 'function' ? require('./underscore.js') : window._;




}());

// var _ = require('./underscore.js');
var _ = require('lodash');
var u = {

    // Concat mixture of arrays/numbers
    c: function() {
        return [].concat.apply([], _.toArray(arguments));
    },

    sum: function() {
        return _.reduce(u.c.apply(this, arguments), function(mem, n) {
            return mem + n;
        });
    },

    seq: _.range,

    badd: function(x, y) {
        // genlize: wrap num as array,
        // then for any 2 arrs, if len divides the other len, distribute
        // console.log(_.toArray(arguments));
        console.log(_.map([x, y], _.size));
        // var t = _.map()
    },
    distributeRight: function(fn, x, Y) {
        var len = Y.length,
            res = Array(len);
        while (len--) res[len] = Y[len] instanceof Array ?
            u.distributeRight(x, Y[len]) :
            fn(x, Y[len])
        return res;
    },
    distributeLeft: function(fn, X, y) {
        var len = X.length, res = Array(len);
        // while (len--) res[len] = fn(X[len], y);
        while (len--) {
        	res[len] = X[len] instanceof Array ?
        	u.distributeLeft(X[len], y) :
        	fn(X[len], y)
        }
        return res;
    },
    distributeBoth: function(fn, X, Y) {
    	var L, S;
    	if (X.length > Y.length) {L = X; S = Y;}
        else {L = Y; S = X;}
        var Llen = L.length, Slen = S.length, res = Array(Llen);
        while (Llen--) {
        	var s = S[Llen % Slen];
        	res[Llen] = u.distribute(fn, s, L[Llen]);
        	// res[Llen] = s instanceof Array ?
        	// 	u.distribute(fn, s, L[Llen]) :
        	// 	u.distributeLeft(fn, L[Llen], s)
        }
        return res;

        // var Xlen = X.length,
        //     Ylen = Y.length;
        // // if dimensions match
        // if ((Ylen == Xlen) || (Ylen % Xlen == 0) || (Xlen % Ylen == 0)) {
        //     var longer, llen, shorter, slen;
        //     if (Ylen > Xlen) {
        //         longer = Y;
        //         llen = Ylen;
        //         shorter = X;
        //         slen = Xlen;
        //     } else {
        //         longer = X;
        //         llen = Xlen;
        //         shorter = Y;
        //         slen = Ylen;
        //     }
        //     // recursive call of distribute
        //     var res = [],
        //         L = llen - 1;
        //     while (llen--) {
        //         res.push(u.distribute(fn, shorter[(L - llen) % slen], longer[L - llen]));
        //     }
        //     return res;
        // } else throw "Cannot distribute arrays of different dimensions.";

        // var L, S;
        // if (X.length > Y.length) {L = X; S = Y;}
        // else {L = Y; S = X;}
        // var Llen = L.length, Slen = S.length, res = Array(Llen);
        // while (Llen--) {
        // 	var s = S[Llen % Slen];
        // 	res[Llen] = s instanceof Array ?
        //         u.distributeBoth(fn, s, L[Llen]) :
        //         u.distributeLeft(fn, s, L[Llen])
        // }
        // return res;

    },
    // applying function fn by distributing x over y, or y over x, dep on len
    distribute: function(fn, X, Y) {
    	if (X instanceof Array) {
            return Y instanceof Array ?
            u.distributeBoth(fn, X, Y) :
            u.distributeLeft(fn, X, Y);
            // u.distributeRight(fn, Y, X);
        }
        else {
        	return Y instanceof Array ?
                u.distributeLeft(fn, Y, X) :
                // u.distributeRight(fn, X, Y) :
                fn(X, Y);
        }
        // var xn = (X instanceof Array),
        //     yn = (Y instanceof Array);
        // if (!xn && !yn) return fn(X, Y);
        // else if (xn && !yn) {
        //     return u.distributeLeft(fn, X, Y);
        // } else if (yn && !xn) {
        //     return u.distributeLeft(fn, Y, X);
        // } else {
        //     return u.distributeBoth(fn, X, Y);
        // }
    },
    // basis to build all multi-args fn from binary fn, where arg[0] = fn, rest = args
    // Reimplement dis using while
    associate: function(fn, argsObj) {
        // var fn = arguments[0];
        // return _.reduce(_.toArray(arguments).slice(1), function(mem, n) {
        //     return u.distribute(fn, mem, n);
        // });
        return _.reduce(_.toArray(argsObj), function(mem, n) {
            return u.distribute(fn, mem, n);
        });
    },
    add: function() {
        // return _.reduce(u.c.apply(this, arguments), function(mem, n) {
        //        return u.b_add(mem + n);
        //    });
        // console.log(u.c(u.b_add, _.toArray(arguments)));
        return u.associate(u.b_add, arguments);
        // return u.b_add()
    },
    b_add: function(x, y) {
        return x + y
    }
}

// console.log(v);
// console.log(w);
// console.log(z);
// console.log(u.distribute(u.add, v, w));
// console.log(u.distribute(u.add, v, 2));
// console.log(u.distribute(u.add, z, w));
// console.log(u.associate(u.add, v, w))
// console.log(u.add(v, w));
// console.log(
// u.sum(v, v),
// u.c(v, v)
// );


// console.log(u.sum(1));
// console.log([].concat(1,2));
// console.log(u.c(v, v, 1));

// try {
//     console.log(u.vecBinAdd(v, w));
// } catch (error) {
//     console.log("fuck")
// };


// modify above:
// asso: use the while structure on arguments
// distri: use multiple while? 
// don't use apply and % etc expensive fn
// decrease the number of fn calls, especially wrapped fn
// careful with unshift vs push

var m = require('mathjs');
// console.log(m.add(v,v));

// function sum() {
//     // return _.reduce(u.c.apply(this, arguments), function(mem, n) {
//     return _.reduce(arguments, function(mem, n) {
//         return mem + n;
//     });
// };


// array sum: internal method. input a single (multi)array
function asum(v) {
    var res = 0;
    var len = v.length;
    while (len--) {
        res += (v[len] instanceof Array ? asum(v[len]) : v[len])
    }
    return res;
};
// best: 7 times faster than R. 4~5 times faster than mathjs
function sum() {
    var res = 0;
    var len = arguments.length;
    while (len--) {
        res += (arguments[len] instanceof Array ? asum(arguments[len]) : arguments[len])
    }
    return res;
};
// best. 5 times faster than R
function c() {
    // var res = [];
    var len = arguments.length;
    var res = Array(len);
    var L = len - 1;
    while (len--) {
        if (arguments[L - len] instanceof Array) res = res.concat(arguments[L - len]);
        else res.push(arguments[L - len]);
    }
    return res;
};

function c2() {

}


// console.log(v[1].length)

// var f = (typeof v == 'number');
// console.log(f);

// console.log("asum", asum([0,1,[2,3,4],5,v]));
// console.log("sum", sum(0, 1, 2, 3, 4, 5, v)); // 2.6


// // fast as x+y; no major delay from fn wrapping
// function aadd(x, y) {
//     return x + y;
// };
// // best: twice faster than R, 3 times faster than mathjs
// // also can add diff dims like in R, whereas mathjs cant
// function add(X, Y) {
//     return u.distribute(aadd, X, Y);
// };

// // Do dis next: use while + push arr trick
// // Do dis next: use while + push arr trick
// // Do dis next: use while + push arr trick
// // Do dis next: use while + push arr trick
// // Do dis next: use while + push arr trick
// function associate() {
//     return u.distribute(add, v, v);
// };

// function ladd() {
// 	// try {
// 	// 	// return aadd(arguments[0], arguments[1]);
// 	// 	return aadd.apply(null,arguments);
// 	// }
// 	// catch (error) {
// 	// 	console.log("args are", arguments);
// 	// }
//     var len = arguments.length,
//         res = add(arguments[--len], arguments[--len]);
//     // while (len--) {
//     // 	res = add(res, arguments[len]);
//     // }
//     while (len--) res = add(res, arguments[len]);
//     return res;
// }


function aadd(x, y) {
    return x + y;
};

function add2(X, Y) {
    return u.distribute(aadd, X, Y);
}

function add() {
    var len = arguments.length,
        res = add2(arguments[--len], arguments[--len]);
    while (len--) res = add2(res, arguments[len]);
    return res;
    // return u.asso(u.b_add, _.toArray(arguments))
}


function vadd(X, Y) {
    var res = [],
        len = X.length,
        L = len - 1;
    while (len--) res.push(aadd(X[L - len], Y[L-len]));
    return res;
}

// var v = [0, 1, 2, 3, 4, 5];
var v = [0,1,2,3,4,5]
// var x = v.slice(0);
// var y = v.slice(0);
// var z = v.slice(0);
// console.log(x);
// var w = [0,1];
// var z = [v, v];

// function test

// console.log(ladd(v, v, v))
console.log(add(v, 1))

// console.log("dual", ladd(v,w))
// console.log("meh", u.distribute(u.b_add, v,v));
// console.log(add(v,w));
// console.log(add(v, _.range(3)));
// console.log(add(_.range(3), v));
// console.log(m.add(v, v));
// var x = add(v, v);
function benchmark() {
    var MAX = 50000000;
    var start = new Date().getTime();
    while (MAX--) {
        // add(v,1); // 3.5
        // add(v,v); // 7.1
        // ladd(x,x,x); //
        // ladd(x,y,z);
        // ladd(ladd(v,v),v); // triple target: 30s wtffff
        // add(add(v,v),v) // 28
        // var x = aadd(1,1);
        // aadd(aadd(1,1),1);
        // aadd(1,1);
        // aadd(x,1); 
        // add(1,1);
        // ladd(1,1)
        // ladd(v,1,1); // 4s
        // ladd(v,v); // 8s R: 16s
        // m.add(v,v); // 21s
        // ladd(v,v,v);
        // add(add(v,v),v) //37
        // ladd(x,y); //8.5
        // v.slice(0);
        // vadd(v,v); //2.9
        // vadd(vadd(x,x),x); //5.6
        // vadd(vadd(v,v),v); //6.2
        // 
        // vadd(x,x);
        // ladd(y,y,y); // 16.5
        // ladd(v,v,v); // 30
        // ladd(x,y,z); //8.5
        // add(add(v,1),1) 18s
        // add(add2(v,v), v);
        // ladd(v,v,v); // 28 R: 25s wtfff. R v+w:17s

        // typeof v == 'number';
        // typeof v == 'number';
        // v instanceof Array
        // v instanceof Array

        // badd(v,1); // 3 vs R: 15.8
        // aadd(1,1); // 0.07
        // console.log(add(1,1))
        // add(1, 1); // 0.52 vs R w/ 1+1: 9.13
        // add(v,1); // 3.3 vs R: 15.8
        // add(v,v); // 8 vd R: 17
        // add(v,w); // 7 vd R: 17

        // m.add(1, 1); // 0.56
        // m.add(v, v); // 21.8

        // v.push(0);
        // v.pop();
        // v.shift(0);
        // v.unshift();

        // _.isNumber(v); //5
        // var f = (typeof v == 'number'); //0.086
        // _.size(v); //0.59
        // v.length; //0.072
        // 
        // 1+1; //0.07
        // aadd(1,1); //0.07

        // m.sum(v) // 12s
        // m.sum(0,1,2,3,4,5) // 13s
        // m.sum(0,1,2,3,4,5,v) //12.4

        // asum(v); // 2.9 vs R: 18.7
        // asum([v,v]); // 7.7 vs R: 18.7
        // asum([0,1,2,3,4,5,v]); //6.1
        // asum([0,1,[2,3,4],5,v]); //8.2

    	// _.sum(0,1)
    	// _.sum(v)
    	// sum(v); //3.09
        // sum(0,1,2,3,4,5); // 2.5 new 1.45 using instanceof
        // sum(0,1,2,3,4,5,v); // 5.4 new 3.4 vs R: 53
        // sum(0,1,[2,3,4],5,v); //15.7

        // v instanceof Array;
        // Array.isArray(v)
        // [2,3,4] instanceof Array;
        // 2 instanceof Array;
        // Array.isArray([2,3,4])

        // Concat
        // c(0,1,2,3,4,5); // 3.3 per 50mil runs
        // c(v); //9.1
        // c(0,1,2,3,4,5,v); //14.37
        // c(0,1,v,v); //22.1
        // c(0,1,[2,3,4],5,v); //5.3
        
        // _.range(10);

    }
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time: ' + time / 1000, 'seconds');
}


benchmark();

// quick benchmark fn. only works for fn that takes in single arg
// for more generic benchmark see below
function bm(fn, arg) {
    var MAX = 50000000;
    var start = new Date().getTime();
    while (MAX--) {
        fn(arg);
    }
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time: ' + time / 1000, 'seconds');
}





function unshiftprepend() {
    var res = [],
        len = 10;
    while (len--) {
        res.unshift(len);
    }
    return res;
}

// the best pattern. 16 times faster than append()
function pushprepend() {
    var res = [],
        len = 10,
        L = len - 1;
    while (len--) {
        res.push(L - len);
    }
    return res;
}

// TOC alternative/
function factorial(n) {
    return n ? n * factorial(n - 1) : 1
}

function factorial(n) {
    function recur(n, acc) {
        return n == 0 ? acc : recur(n - 1, n * acc);
    }
    return recur(n, 1);
}

function factorial(n) {
    var _factorial = function myself(acc, n) {
        return n ? myself(acc * n, n - 1) : acc
    };
    return _factorial(1, n);
}

console.log(factorial(10));


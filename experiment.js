(function() {
    var _ = typeof require == 'function' ? require('./underscore.js') : window._;




}());

var _ = require('./underscore.js');
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
    // if both nums or if y longer, return 1; if x shorter, return -1; else return 0
    multlen: function(x, y) {
        // if (_.isNumber(x) | _.isNumber(y)) return 1;
        var l = _.map([x, y], _.size);
        if (l[1] % l[0] == 0) return -1;
        // if (l[1] % l[0] == 0) return l[1] / l[0];
        if (l[0] % l[1] == 0) return 1;
        // if (l[0] % l[1] == 0) return l[0] / l[1];
        return 0;
    },
    // applying function fn by distributing x over y, or y over x, dep on len
    distribute: function(fn, X, Y) {
        var xn = (typeof X == 'number'),
            yn = (typeof Y == 'number');
        if (xn && yn) return fn(X, Y);
        if (!xn && yn) {
        	var res = [], len = X.length, L = len-1;
        	while(len--) res.push(fn(X[L-len], Y));
        	return res;
        }
        if (!yn && xn) {
			var res = [], len = Y.length, L = len-1;
        	while(len--) res.push(fn(X, Y[L-len]));
        	return res;
        }
        var Xlen = X.length,
            Ylen = Y.length;
        // if dimensions match
        if ((Ylen == Xlen) | (Ylen % Xlen == 0) | (Xlen % Ylen == 0)) {
            var longer, llen, shorter, slen;
            if (Ylen > Xlen) {
                longer = Y; llen = Ylen; shorter = X; slen = Xlen;
            } else {
                longer = X; llen = Xlen; shorter = Y; slen = Ylen;
            }
            // recursive call of distribute
            var res = [], L = llen-1;
            while(llen--) {
            	res.push(u.distribute(fn, shorter[(L-llen) % slen], longer[L-llen]));
            }
            return res;
        } else throw "Cannot distribute arrays of different dimensions.";
    },
    // basis to build all multi-args fn from binary fn, where arg[0] = fn, rest = args
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

var v = _.range(6);
var w = _.range(2);
var z = [v, v];
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
        res += (Array.isArray(v[len]) ? asum(v[len]) : v[len])
    }
    return res;
};
// best: 7 times faster than R. 4~5 times faster than mathjs
function sum() {
    var res = 0;
    var len = arguments.length;
    while (len--) {
        res += (Array.isArray(arguments[len]) ? asum(arguments[len]) : arguments[len])
    }
    return res;
};
// best. 5 times faster than R
function c() {
    var res = [];
    var len = arguments.length;
    var L = len - 1;
    while (len--) {
        if (Array.isArray(arguments[L - len])) res = res.concat(arguments[L - len]);
        else res.push(arguments[L - len]);
    }
    return res;
};


// console.log(v[1].length)

// var f = (typeof v == 'number');
// console.log(f);

// console.log("asum", asum([0,1,[2,3,4],5,v]));
// console.log("sum", sum(0, 1, 2, 3, 4, 5, v)); // 2.6


// fast as x+y; no major delay from fn wrapping
function aadd(x, y) {
    return x + y;
};
// best: twice faster than R, 3 times faster than mathjs
// also can add diff dims like in R, whereas mathjs cant
function add(X, Y) {
    return u.distribute(aadd, X, Y);
};


console.log(v);
// console.log(add(v, _.range(3)));
// console.log(add(_.range(3), v));
console.log(m.add(v, v));

function benchmark() {
    var MAX = 50000000;
    var start = new Date().getTime();
    while (MAX--) {
        // typeof v == 'number';
        // typeof v == 'number';

        // badd(v,1); // 3 vs R: 15.8
        // aadd(1,1); // 0.07
        // console.log(add(1,1))
        // add(1, 1); // 0.09
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
        // asum([0,1,2,3,4,5,v]); //8.3
        // asum([0,1,[2,3,4],5,v]); //8.2

        // sum(0,1,2,3,4,5); // 2.5
        // sum(0,1,2,3,4,5,v); //5.4
        // sum(0,1,[2,3,4],5,v); //6.5

        // c(0,1,2,3,4,5); // 0.9 per 10mil runs
        // c(0,1,v,v); //4.5
        // c(0,1,[2,3,4],5,v); //5.3
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

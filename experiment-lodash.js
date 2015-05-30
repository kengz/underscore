// high perf, R-like math lib implemented using lodash

var _ = require('lodash');
var m = require('mathjs');

var v = _.range(6);
var w = [0, 1, 2, 3, 4, 5];
var x = [0, 1, 2, 3, 4, 5, w];

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
        function recur(n, acc) {
            var len = n.length;
            while (len--)
                acc += n[len] instanceof Array ? recur(n[len], 0) : n[len]
            return acc;
        };
        // actual function call; recurse if need to
        var total = 0,
            len = v.length;
        while (len--) {
            total += (v[len] instanceof Array ? recur(v[len], 0) : v[len])
        }
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
        while (len--)
            res += (arguments[len] instanceof Array ? u.asum(arguments[len]) : arguments[len])
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
        var length = Math.max(Math.ceil((stop - start) / step), 0)+1;
        var range = Array(length);

        for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }
        return range;
    },


    // functional backend: distribute and associate

    add: function() {

    }
}

console.log(u.seq(10))

// console.log(arr instanceof Array);
function benchmark() {
    var v = [];
    var MAX = 50000000;
    var start = new Date().getTime();
    while (MAX--) {
        // u.sum([[[v]]]) //7.11
        // u.seq(10); //3.0
        // _.range(10); //3.6
    }
    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time: ' + time / 1000, 'seconds');
}

benchmark();

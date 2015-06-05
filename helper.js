var _ = require('lodash');

var h = {
    // helper: unary plus ++
    uplus: function(n) {
        return ++n;
    },
    // helper: unary vector plus
    uVplus: function(V) {
        return _.map(V, h.uplus);
    }
}

exports.h = h;


// Use obejct arguments length instead of toArray
// function list:
// 
// function composition:
// flow, flow right, distribute, asso, wedge(cross), index-sum
// 
// Logical:
// &&, ||, eq, xor, is_: Integer, Double
// 
// basic arithmetic and functions
// +-*-
// 
// transformation
// vector ops (dot, cross), matrix ops (mult, transpose)
// 


// Aim now: remove recursion from distribute

var app = function(fn, x, y) {
    return fn(x, y);
};
var i = 'iching';

// Assuming tensors are rectangular hyperdim arrays

// Get the dimension of a tensor
var dim = function(T) {
    var dim = [],
        ptr = T;
    while (ptr.length) {
        dim.push(ptr.length);
        ptr = ptr[0];
    }
    return dim;
};

var reshape = function(arr, dimArr) {
    var tensor = arr;
    var len = dimArr.length;
    while (--len) {
        tensor = _.chunk(tensor, dimArr[len]);
    }
    return tensor;
};

var disflat = function(fn, x, Y) {
    return _.map(Y, _.partial(fn, x));
}

var multiply = function(x, y) {
    return x * y;
}

// Check if a tensor is flat
var isFlat = function(T) {
	// var flat = true, len = T.length;
 //    while(len--)
 //        flat *= !(T[len] instanceof Array);
 //    return flat;
 return _.reduce(_.map(T, _.negate(_.isArray)), multiply, true);

};
// v = _.range(10);
// console.log(isFlat(v));
// console.log(isFlat([v,v]));
// // flatten a tensor
// var my_flatten = function(T) {
//     var stack = [];
//     for (var i = 0; i < T.length; i++) {
//         for (var j = 0; j < T[i].length; j++) {
//             stack.push(T[i][j]);
//         };
//     };
//     return stack;
// };

// // need check each entry is flat. works for rectangular now
// var my_flattenDeep = function(T) {
//     // will cahnge stack[0]... to cehck whole array entries not Arr
//     var stack = T,
//         cont = !isFlat(stack);
//     while (cont) {
//         stack = my_flatten(stack);
//         cont = !isFlat(stack);
//     }
//     return stack;
// }


// formation: use stack to extract all nums as flattened array,
// apply binary numeric op
// then distribute and reshape

var flat_dist = function(fn, x, Y) {
    var stack = _.flattenDeep(Y);
    return _.map(stack, _.partial(x));



    // var stack = [];
    // stack.push(Y);
    // while (stack.length) {
    //     var current = stack.pop();
    //     if (!current[0].length) {
    //         var len = current.length,
    //             res = Array(len);
    //         while (len--) res[len] = fn(x, current[len]);
    //         return res;
    //     }
    //     // var clen = current.length, L = clen-1;
    //     // while(clen--) stack.push(current[L- clen]);
    //     _.each(current, function(sub) {
    //         stack.push(sub);
    //     })
    // }
}

// will this be the most efficient way? I dunno, let's see:
// when distribute: chain: get dim, flatten, apply, reshape

// var sum2 = _.partial(_.to)

function ter(a,b,c) {
	console.log(a+b+c);
}

var foo = ter.bind(null, '','a');
foo('d','e')
// var foo = _.partial(ter, 'a','b');
// foo('c');
// var v = [0, 1, 2, 3, 4];
// var m = [v, v, v];
// // console.log(sum2(v))
// // console.log(sum2(1,2,3,4,5))
// // console.log(sum2(m))
// var di = dim(m);
// var flat = _.flattenDeep(m);
// var rem = reshape(flat, di);

// console.log(reshape(reshape(v,[2]),[2]))
// console.log(reshape(v,[2,2]))


// var mychunk = function(arr, size) {
//     var res = [];
//     for (var i = 0; i < arr.length / size; i++) {
//         var row = [];
//         for (var j = 0; j < size; j++) {
//             row.push()
//         };
//     };
//     return res;
// }

// var neg = function(x) {return -x;}
// var m = [[1,2],[3,4]];
// console.log(_.map(m[0], neg))
// console.log(m[0], neg))

// console.log(_.map(_.map(m),_.negate))
// USE MAP

// try doing by mutating object (can copy first)
// var flat_distributeRight = function(fn, x, Y) {
// 	var tmp = Y;
// 	while(!tmp[0].length) {
// 		tmp = _.map()
// 	}

// }

var fs = require('fs')
var through = require('through')
var split = require('split')
// fs.createReadStream(process.argv[2]).pipe(process.stdout);




// INPUT OUTPUT
// process.stdin.pipe(process.stdout)



// LINES
// var stream = through(write, end)
//
// function write (buffer, encoding, next) {
//     this.push(buffer.toString().toUpperCase())
// }
//
// function end () {
// }
// process.stdin.pipe(stream).pipe(process.stdout)






// CONCAT
var x = 0;
process.stdin
    .pipe(split())
    .pipe(through(function (line) {
        var text = line.toString()
        text = (x % 2 === 0) ? text.toLowerCase() : text.toUpperCase()
        this.push(text)
    }))
    .pipe(process.stdout)

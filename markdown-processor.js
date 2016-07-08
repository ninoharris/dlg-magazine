
// Dependencies
var fs = require('fs')
var marked = require('marked')
var through = require('through2')
var split = require('split')

// REGEX
var imgRegex = /IMG/
var urlRegex = /href="([^"]+)"/

// INPUT/OUTPUT
var fileIn = fs.createReadStream(process.argv[2])
var fileOut = fs.createWriteStream('fromMarkdown.html')

fileIn.pipe( through( function (chunk) {
    this.push(marked(chunk.toString())) // Markdown parser
}))
.pipe(split())
.pipe(through(readLine))
.pipe(fileOut) // Write to file

// Filter through each line and modify as necessary
function readLine(line, encoding, next) {
    line = line.toString() // Line is initially a buffer
    this.push(includeBlank(line) + "\n\n") // Push sends it to the next pipe with an extra linebreaks
    next() // Go to next line
}

// Any external links are given an extra target="_blank"
function includeBlank(line) {
	externalTargetBlank = line.replace(urlRegex, replacer)
    return externalTargetBlank;
}

function isDLUrl(url) {
	url = url.toLowerCase()
	return (url.indexOf('directline') > -1 ||
    url.indexOf('dl.com') > -1
    )
}

function replacer(match, url) {
	if(!isDLUrl(url)) { // If external
    	return match + ' target="_blank" '
    } else {
    	return match // For DL urls
    }
}

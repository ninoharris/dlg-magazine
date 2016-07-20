// Dependencies
var fs = require('fs')
var marked = require('marked')
var through = require('through2')
var split = require('split')
var prompt = require('prompt-sync')({
    history: require('prompt-sync-history')("prompt-history.txt"),
    sigint: true
})
var handlebars = require('handlebars')

// REGEX
var imgRegex = /IMG/
var urlRegex = /href="([^"]+)"/g

// INPUT/OUTPUT
var fileIn = fs.createReadStream(process.argv[2])
var fileOut = fs.createWriteStream('fromMarkdown.html')

var config = require('./config.json')
const PATH = config["resultsFolder"]

fileIn.pipe( through( function (chunk) {
    this.push(marked(chunk.toString())) // Markdown parser
}))
.pipe(split())
.pipe(through(readLine))
.pipe(fileOut) // Write to file

// Filter through each line and modify as necessary
function readLine(line, encoding, next) {
    line = line.toString() // Line is initially a buffer
    this.push(processLine(line) + "\n\n") // Push sends it to the next pipe with an extra linebreaks
    next() // Go to next line
}

function processLine(line) {
    if (line.toUpperCase().match('IMG'))
        return includeImg(line)
    return includeBlank(line)
}

function includeImg(line) {
    var imgName, imgTitle
    do {
        imgName = prompt('Image include, line reads. What is the name of the image (without -m.jpg or -d.jpg)?\n')
    } while(imgName !== "undefined" && !bothImageSizesExist(imgName))

    console.log("Both images exist, awesome!")

    do {
        imgTitle = prompt('What is the image title?')
    } while(imgTitle.length < 1)
    return responsiveImgHTML(imgName, imgTitle)
}

function bothImageSizesExist(imgName) {
    var imgPath = PATH + "article/" + imgName
    try {
        fs.accessSync(imgPath + '-m.jpg', fs.F_OK)
        fs.accessSync(imgPath + '-d.jpg', fs.F_OK)
        return true
    } catch(e) {
        return false
    }

}

function responsiveImgHTML(imgName, imgTitle) {
    var fields = {
        "img-name": imgName,
        "img-title": imgTitle
    }
    var sourceFile = fs.readFileSync('./image-include-template.html', 'utf8')
    var template = handlebars.compile(sourceFile)
    var result = template(fields)
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

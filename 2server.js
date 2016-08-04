const http = require('http')
const fs = require('fs')
const formidable = require('formidable')
const util = require('util')
const Handlebars = require('handlebars')
const marked = require('marked')
const colours = require('colors')

const config = require('./config.json')
const OUTPUT_PATH = ts(config["desktopPath"])
const imgTemplate = ('image-include-template.html')



// const imgRegex = /IMG *([\w-_\/]+?)-? *"(.*)"?/
const imgRegex = /IMG *\[(.+)\]( *\((.+)\))?/
// https://regex101.com/r/vD9vB0/1
// IMG *	IMG followed by any amount of spaces
// ()		capture content inside, this is the filename
// [\w-_\/]	Any letter, hyphen or forward-slash
// +? 		For any length > 1, but non-greedy.
//					This is to ignore a final "-" which will be added later
// ()-?		An optional dash can be used, but is NOT part of the text capture
//  *		any number of spaces
// "(.*)"?	Anything between quotes is captured for alt tag.
//					question mark at end allows for incomplete quote

const urlRegex = /href="([^"]+)"/g


var renderer = new marked.Renderer()

var creatingListCurrently = true

renderer.link = function (href, title, text) {
	var openBlank = !isDLUrl(href) ? "target='_blank'" : ""
	var title = !isDLUrl(href) ? title + " (opens in a new tab)" : title
	return "<a href='" + href + "' " + openBlank + " title='" + title + "'>" + text + "</a>"
}
renderer.paragraph = function (text) {
	return "<p>" + text + "</p>\n\n"
}


var server = http.createServer(function (req, res) {
    if (req.method.toLowerCase() == 'get') {
        console.log("The form has been opened")
        displayForm(res)
    } else if (req.method.toLowerCase() == 'post') {
        processAllFieldsOfTheForm(req, res)
    }

})
const PORT = 1185

function displayForm(res, fields) {
    fs.readFile('form.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': data.length
        })

        if(!fields) fields = {}

        var formTemplate = Handlebars.compile(data.toString())
        var output = formTemplate(fields)

        res.write(output)
        res.end()
    })
}

function processAllFieldsOfTheForm(req, res) {
    var form = new formidable.IncomingForm()
    var whatTheUserTypedIn
    form.parse(req, function (err, fields) {
        res.writeHead(200, {
            'content-type': 'text/plain'
        })
        whatTheUserTypedIn = fields
        console.log(whatTheUserTypedIn)
        // console.log("process all", fields)

        createFile(fields)

        res.write('received the data:\n\n')
        res.write(JSON.stringify(fields))
        res.end()
    })
    // displayForm(res, whatTheUserTypedIn)
}

function createFile(fields) {
    fields["product-capital"] = capitalizeFirstLetter(fields["product"])
    // console.log(fields["markdown-entry"])
    fields["markdown-entry"] = getHTMLFomMarkdown(fields["markdown-entry"])

    var url = fields.url
    var category = fields.category
    var product = fields.product

    var templateFile = fs.readFileSync(getTemplateFromCategory(category), 'utf8')

    var template = Handlebars.compile(templateFile)
    var result = template(fields)

    // console.log(fields)

    var outputFilePath = getOutputFilePath(category, url, product)

    fs.writeFile(outputFilePath, result, function(err) {
        if (err) {
            return console.log(err)
        }
        console.log("The file was saved at", outputFilePath)
    })

    // Open up page
    var spawn = require('child_process').spawn
    spawn('open', [getProductionPath(category, url, product)]);

}

function getTemplateFromCategory(category) {
    // console.log(category)
    var source = category === 'driving' ? './templates/driving-template.html' :
    category === 'homegarden' ? './templates/homegarden-template.html' :
    category === 'lifestyle' ? './templates/lifestyle-template.html' : ''

    if (source === '') throw new Error("Category error")

    return source
}

function getOutputFilePath(category, url, product) {
    categoryFilePath = getCategoryFilePath(category, product)

    // console.log(OUTPUT_PATH + ts(categoryFilePath) + url + ".html")
    return OUTPUT_PATH + ts(categoryFilePath) + url + ".html"
}

function getProductionPath(category, url, product) {
    categoryFilePath = getCategoryFilePath(category, product)
    return ts("http://dev.directline.com/") + ts(categoryFilePath) + url + ".html"
}

function getCategoryFilePath(category, product) {
    var categoryFilePath
    if (category === 'driving') categoryFilePath = "car-insurance/driving/"
    if (category === 'homegarden') categoryFilePath = "home-insurance/home-and-garden/"
    if (category === 'lifestyle') {
        if (product === 'pet') { categoryFilePath = "pet-insurance/lifestyle/"
        } else if (product === 'life') { categoryFilePath = "life-insurance/lifestyle/"
        } else if (product === 'travel') { categoryFilePath = "travel-insurance/lifestyle/"
        }
    }
    return ts(categoryFilePath)
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getHTMLFomMarkdown(content) {
    // var lines = content.split("\n")
    // var result = lines.map(convertLine).join("")
	var indent = "\r\n\t\t\t\t"
	var result = content.split("\n").map(includeImg).join("")
	result = marked(result, { renderer: renderer })
	result = result.split("\n").map(includeBlank).join(indent)
    return indent + result
}

function includeImg (line) {
	if(line.toUpperCase().indexOf("IMG") == -1) {
		return line // For lines not including an image
	}
	// Image includes must follow format:
	// IMG(image-name)["title text"]
	var imgProps = imgRegex.exec(line)
	console.log("Image info".blue)
	console.log(imgProps)
	console.log(imgRegex)
	var templateData = {}

	if(imgProps == null) 	// If it doesn't work, make the result bold so that you can see it in testing
		return "<strong>" + line + "</strong>"

	// Sees if regex "imgRegex" has matched:
	// if an array is returned, use first item for name.
	// If regex returns string, use that instead for name, and leave alt attr empty
	console.log("IMG added:".green, imgProps)

	templateData["img-name"] = imgProps[1]
	templateData["img-title"] = imgProps[3]

	try {
		doBothImagesExist(templateData["img-name"])
		var template = Handlebars.compile(fs.readFileSync("./templates/" + imgTemplate, 'utf-8'))
		return template(templateData)
	} catch(e) {
		throw new Error("Something went wrong with including the image: " + templateData["img-name"], e)
	}
}

function doBothImagesExist(imgName) {

	fs.access(OUTPUT_PATH.split(1) + ts("lib/img/magazine/article/") + imgName + "-body-m.jpg", doesImageExist)
	fs.access(OUTPUT_PATH.split(1) + ts("lib/img/magazine/article/") + imgName + "-body-d.jpg", doesImageExist)

	function doesImageExist(err) {
		if (err) {
			console.log("Sorry img was not found for: ".pink, err.toString().pink)
		}
	}
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
		console.log(match)
    	return match + ' target="_blank" '
    } else {
    	return match // For DL urls
    }
}

function ts(str) {
	return trailingSlash(str)
}

function trailingSlash(str) {
    return str.replace(/\/$/,"") + "/"
}








server.listen(PORT)
console.log('server listening on', PORT)

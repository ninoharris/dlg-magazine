const http = require('http')
const fs = require('fs')
const formidable = require('formidable')
const util = require('util')
const Handlebars = require('handlebars')
const marked = require('marked')

const config = require('./config.json')
const OUTPUT_PATH = config["desktopPath"]




const imgRegex = /IMG/
const urlRegex = /href="([^"]+)"/g



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
    console.log(fields["markdown-entry"])
    fields["markdown-entry"] = getHTMLFomMarkdown(fields["markdown-entry"])

    var url = fields.url
    var category = fields.category
    var product = fields.product

    var templateFile = fs.readFileSync(getTemplateFromCategory(category), 'utf8')

    var template = Handlebars.compile(templateFile)
    var result = template(fields)

    console.log(fields)

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
    console.log(category)
    var source = category === 'driving' ? './driving-template.html' :
    category === 'homegarden' ? './homegarden-template.html' :
    category === 'lifestyle' ? './lifestyle-template.html' : ''

    if (source === '') throw new Error("Category error")

    return source
}

function getOutputFilePath(category, url, product) {
    categoryFilePath = getCategoryFilePath(category, product)

    console.log(OUTPUT_PATH + categoryFilePath + url + ".html")
    return OUTPUT_PATH + categoryFilePath + url + ".html"
}

function getProductionPath(category, url, product) {
    categoryFilePath = getCategoryFilePath(category, product)
    return "http://dev.directline.com/" + categoryFilePath + url + ".html"
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
    return categoryFilePath
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}




function getHTMLFomMarkdown(content) {
    var lines = content.split("\n")
    var result = lines.map(convertLine).join("\n")
    return result
}

function convertLine(line) {
    return includeBlank(marked(line))
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











server.listen(PORT)
console.log('server listening on', PORT)

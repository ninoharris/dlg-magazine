var http = require('http')
var fs = require('fs')
var formidable = require('formidable')
var util = require('util')
const Handlebars = require('handlebars')

const config = require('./config.json')
const OUTPUT_PATH = config["desktopPath"]

var server = http.createServer(function (req, res) {
    if (req.method.toLowerCase() == 'get') {
        console.log("The form has been opened")
        displayForm(res)
    } else if (req.method.toLowerCase() == 'post') {
        processAllFieldsOfTheForm(req, res)
    }

})
const PORT = 1185

function displayForm(res) {
    fs.readFile('form.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': data.length
        })
        res.write(data)
        res.end()
    })
}

function processAllFieldsOfTheForm(req, res) {
    var form = new formidable.IncomingForm()

    form.parse(req, function (err, fields) {
        res.writeHead(200, {
            'content-type': 'text/plain'
        })

        console.log("process all", fields)

        createFile(fields)

        res.write('received the data:\n\n')
        res.end(JSON.stringify(fields))
    })
}

function createFile(fields) {
    fields["product-capital"] = capitalizeFirstLetter(fields["product"])

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
        console.log("The file was saved under", outputFilePath)
    })
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
    var categoryFilePath
    if(category === 'driving')
        categoryFilePath = OUTPUT_PATH + "car-insurance/driving/"
    if(category === 'homegarden')
        categoryFilePath = OUTPUT_PATH + "home-insurance/home-and-garden/"
    if(category === 'lifestyle') {
        if (product === 'pet') {
            categoryFilePath = OUTPUT_PATH + "pet-insurance/lifestyle/"
        } else if (product === 'life') {
            categoryFilePath = OUTPUT_PATH + "life-insurance/lifestyle/"
        } else if (product === 'travel') {
            categoryFilePath = OUTPUT_PATH + "travel-insurance/lifestyle/"
        }
    }

    console.log(categoryFilePath + url + ".html")
    return categoryFilePath + url + ".html"
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

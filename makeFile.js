// Dependencies
var fs = require('fs')
var through = require('through2')
var split = require('split')

var resultsFolder = "/Users/santurninoharris/sites/t3-dl-reboot/html/desktop/" // The folder in which renamed images are put MUST CONTAIN TRAILING /
var html = ""
var url
var folder
var product

var prompt = require('prompt-sync')({
  history: require('prompt-sync-history')(),
  sigint: true
});

var post = {}

do {
    post["article-category"] = prompt('Category (driving/lifestyle/home-and-garden): ');
} while(post["article-category"] !== "driving" && post["article-category"] !== "lifestyle" && post["article-category"] !== "home=and-garden")

if(post["article-category"] === "driving") {
    product = "car-insurance/"
    folder = "driving/"
}
if(post["article-category"] === "lifestyle") {
    product = lifeStyleProduct()
    folder = "lifestyle/"
}
if(post["article-category"] === "home-and-garden") {
    product = "home-insurance/"
    folder = "home-and-garden/"
}

url = prompt('URL (must include .html):')
console.log(product + folder + url)

post["page-title"] = prompt('Page title: ');
// post["page-description"] = prompt('Page description: ');
// post["page-image"] = prompt('Page image: ');
// post["article-author"] = prompt('Article author: ');
// post["article-date"] = prompt('Article date: ');
// post["article-heading"] = prompt('Article heading: ');
console.log(post)

html += '<!--#set var="section-id-primary" value="magazine" -->\n'
html += '<!--#set var="section-id-secondary" value="' + post["article-category"] + '" -->\n\n'

for(prop in post) {
    html += '<!--#set var="' + prop + '" value="' + post[prop] + '" -->\n'
}

console.log(html)




var outputFile = fs.createWriteStream(url)
fs.writeFileSync(resultsFolder + product + folder + url, html, function(err) {
    if (err) {
        return console.log(err)
    }
    console.log("the file was saved as: " + url)
})

function lifeStyleProduct() {
    var product
    do {
        product = prompt('What is the product (pet-insurance, life-insurance): ')
    } while(product !== "pet-insurance" && product !== "life-insurance" && product !== "travel-insurance")
    return product
}

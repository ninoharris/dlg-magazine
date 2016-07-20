const Handlebars = require('handlebars')
const fs = require('fs')

var source = fs.readFileSync('./handlebars-example.html', 'utf8')
var template = Handlebars.compile(source);

var data = { "title": "a magazine article"};
var result = template(data);
console.log(result)

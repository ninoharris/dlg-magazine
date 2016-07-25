var jsdom = require("jsdom")

// You can use it with a URL (dont do it simply though, look at config object below)

// you can use raw HTML
jsdom.env(
    '<p><a class="the-link" href="https://github.com/tmpvar/jsdom">jsdom!</a></p>',
    ["http://code.jquery.com/jquery.js"],
    function (err, window) {
        console.log("contents of the a.the-link:", window.$("a.the-link").text())
    }
)

// You can use a configuration object
// Print all of the news items on Hacker News
jsdom.env({
    url: "http://news.ycombinator.com/",
    scripts: ["http://code.jquery.com/jquery.js"],
    done: function (err, window) {
        var $ = window.$
        console.log("Hacker News Links")
        $("td.title:not(:last) a").each(function() {
            console.log(' -', $(this).text())
        })
    }
})


// You can use a raw JavaScript source
// Print all of the news items on Hacker News
var fs = require("fs")
var jquery = fs.readFileSync("../node_modules/jquery/dist/jquery.min.js", "utf8")

jsdom.env({
    url: "http://news.ycombinator.com/",
    src: [jquery],
    done: function (err, window) {
        var $ = window.$
        console.log("HN Links")
        $("td.title:not(:last) a").each(function() {
            console.log(" -", $(this).text())
        })
        // Free up memory associated with the window
        window.close()
    }
})

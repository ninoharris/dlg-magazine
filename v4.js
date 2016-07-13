// Assumptions:
// All images are in .jpg format
// All mobile images contain 'mobile'
// All other images are desktop
// 'mobile' cannot be used as part of the description

// Dependencies
var fs = require('fs') // Filesystem
var mkdirp = require('mkdirp') // Creates output directory
var prompt = require('prompt-sync')({
    history: require('prompt-sync-history')("prompt-history.txt"),
    sigint: true
})

var post = {}

// Regexes for renaming names
var regexNormal = /(.+)(desktop|mobile)-.+\.jpg/
var regexBlur = /(mobile)\?+blur/
var regexHeader = /(mobile?)/

// DO NOT MESS WITH (you can really)
var containsBlur = false // If a blur image is used, ask if we want to make it category header

// Configuration
var config = require('./config.json');
var archive = config.archive
var resultsFolder = config.resultsFolder // The folder in which renamed images are put MUST CONTAIN TRAILING /



// Get directories
do {
    post["release"] = prompt('What is the directory of the release (eg JUL14)?  ')
    prompt.history.save();
} while( !post["release"].length || checkArchiveDirectory(post["release"]) === false )
console.log("Release directory found: " + post["release"])

do {
    post["article-folder"] = prompt('What is the directory of the article? (eg garden-shed-safe)  ')
    post["dirName"] = trailingSlash(post["release"]) + post["article-folder"]
    prompt.history.save();
} while( !post["article-folder"].length || checkArchiveDirectory(post["dirName"]) === false )
console.log("Article directory found: " + post["dirName"])



// // Get type
// if (type != "driving" && type !== "lifestyle" && type !== "homegarden") {
//     throw new Error("Type was not given properly, instead got:" + type)
// }
do {
    post["article-category"] = prompt('Category (driving/lifestyle/homegarden): ');
} while(post["article-category"] !== "driving" && post["article-category"] !== "lifestyle" && post["article-category"] !== "homegarden")

var introMessage = "----------------------" +
"\n--- CHECK BEFORE SAYING YES" +
"\n--- Category: " + post["article-category"] +
"\n--- DirName: " + post["dirName"] +
"\n--- Output folder: " + resultsFolder +
"\n----------------------\n\n"

fs.readdir(post["dirName"], // get files under the dirName specified
    function (err, files) { // callback containing the files from fs.readdir
        if (err) throw new Error("Nino says you have an error getting the files: " + err)

        console.log(introMessage)

        prelimTest(files)

        // User checks output of prelimTest, if they write "y" then we do stuff
        var isReady = false
        do {
            isReady = prompt("Are we ready to go ahead (y/n)")==="y" ? true : false
        } while (isReady === false)

        console.log("Lets go!")

        post["article-name"] = post["article-folder"] // CHANGE MEEEEEEE
        post["isCategoryHeader"] = prompt("Will this be the header for the category of " + post["article-category"] + " (y)?  ") === "y" ? true : false
        post["isMagazineHeader"] = prompt("Will this be the header for the magazine landing (y)?  ") === "y" ? true : false

        renameFiles(files)

        // // Checks to see if user is okay with what's changing
        // rl.question('You should have 2 header files minimum and 2 blurs if a category top post. \nReady to go? (y/yes)',
        // function (answer) {
        //     rl.close()
        //     if (answer !== "yes" && answer !== "y") {
        //         console.error("JUMP SHIP SHE'S SINKING")
        //         process.exit()
        //     } else {
        //         "LETS GO!"
        //         renameFiles(files)
        //     }
        // })


    }
)

function prelimTest(files) {
    for(var i = 0; i < files.length; i++) {
        var file = files[i]
        if (file.indexOf('.jpg') === -1) continue

        var version = getScreenType(file)
        var use = imagePurpose(file)

        console.log(file + ": " + version + " " + use)
    }
}



var input = ""
var output = ""

function renameFiles(files) {
    for(var i = 0; i < files.length; i++) {
        var file = files[i]
        if (file.indexOf('.jpg') === -1) continue

        var newFilename
        var version = getScreenType(file)
        var use = imagePurpose(file)

        if (use === "blur") {
            if( post["isCategoryHeader"] || post["isMagazineHeader"] )
                newFilename = replaceBlur(file, post) + version + ".jpg"
                DLCopyFile(file, "", newFilename)
        } else if (use === "header") {
            newFilename = replaceHeader(file) + version + ".jpg"
            DLCopyFile(file, "article/", newFilename)
        } else if (use === "body") {
            newFilename = replaceBody(file) + version + ".jpg"
            DLCopyFile(file, "article/", newFilename)
        }

        input += newFilename + "\n"
        output += post["dirName"] + newFilename + "\n"

    }

    console.log("INPUT: \n" + input)
    console.log("\nOUTPUT: \n" + output)

}

function imagePurpose(filename) {
    // Order is important, as those with blur may include 'header'
    if (filename.indexOf('blur') > -1) return "blur"
    if (filename.indexOf('header') > -1) return "header"
    return "body"
}
function replaceBlur(fileName, post) {
    if (post["isMagazineHeader"])
        return "latest-background-"
    return post["article-category"] + "-background-"
}
function replaceBody(fileName) {
    var result = regexNormal.exec(fileName)
    var bodyImageName = result[1] // before desktop/mobile bit
    return bodyImageName // will return "XXXXX-body-"
}
function replaceHeader(fileName) {
    return post["article-name"] + "-" + 'header' + "-"
}

// Returns "m" for mobile, "d" for desktop
function getScreenType(filename) {
    if (filename.indexOf('mobile') > -1) // If mobile version
        return "m"
    else {
        return "d"
    }
}

// copies file to source in specified folder.
function DLCopyFile(file, folder, fileName) {
    var path = trailingSlash(archive) + trailingSlash(post["release"]) + trailingSlash(post["article-folder"]) + file
    copyFile(path, resultsFolder + folder + fileName)
}

function copyFile(source, target) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cbCalled = true;
    }
  }
}

function checkArchiveDirectory(directory) {
    return checkDirectory(archive + directory)
}
//function will check if a directory exists, and create it if it doesn't
function checkDirectory(directory) {
  try {
      fs.readdirSync(directory)
      return true
  } catch (e) {
      return false
  }
}

function trailingSlash(str) {
    return str.replace(/\/$/,"") + "/"
}

function createFileIfDoesntExist(file) {
    try {
        fs.accessSync(file)
    } catch (e) {
        fs.writeFileSync(file)
    }
}

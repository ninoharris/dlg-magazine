// Assumptions:
// All images are in .jpg format
// All mobile images contain 'mobile'
// All other images are desktop
// 'mobile' cannot be used as part of the description

// Dependencies
var fs = require('fs') // Filesystem
var mkdirp = require('mkdirp') // Creates output directory
var prompt = require('prompt-sync')({
    history: require('prompt-sync-history')(),
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
var archive = "/Users/santurninoharris/lessons/dlg-magazine/"
var resultsFolder = "/Users/santurninoharris/sites/t3-dl-reboot/html/desktop/lib/img/magazine/" // The folder in which renamed images are put MUST CONTAIN TRAILING /

// Get directory
do {
    post["dirName"] = prompt('What is the directory of the article?  ');
} while(!post["dirName"].length && fs.accessSync(archive + post["dirName"]))

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






function renameFiles(files) {
    for(var i = 0; i < files.length; i++) {
        var file = files[i]
        if (file.indexOf('.jpg') === -1) continue

        var newFilename
        var version = getScreenType(file)
        var use = imagePurpose(file)

        if (use === "blur") {
            containsBlur = true
            newFilename = replaceBlur(file) + version + ".jpg"
            DLCopyFile(dirName + file, "", newFilename)
        } else if (use === "header") {
            newFilename = replaceHeader(file) + 'header' + version + ".jpg"
            DLCopyFile(dirName + file, "article/", newFilename)
        } else if (use === "body") {
            newFilename = replaceBody(file) + version + ".jpg"
            DLCopyFile(dirName + file, "article/", newFilename)
        }

        console.log(newFilename)
        console.log(dirName + resultsFolder + newFilename)

    }
}

function replaceBlur(fileName) {
    return type + "-background-"
}
function replaceBody(fileName) {
    var result = regexNormal.exec(fileName)
    var bodyImageName = result[1] // before desktop/mobile bit
    return bodyImageName // will return "XXXXX-body-"
}
function replaceHeader(fileName) {
    return articleName + "-"
}

function imagePurpose(filename) {
    // Order is important, as those with blur may include 'header'
    if (filename.indexOf('blur') > -1) return "blur"
    if (filename.indexOf('header') > -1) return "header"
    return "body"
}

// Returns "m" for mobile, "d" for desktop
function getScreenType(filename) {
    if (filename.indexOf('mobile') > -1) // If mobile version
        return "m"
    else {
        return "d"
    }
}

function DLCopyFile(source, folder, fileName) {
    copyFile(source, resultsFolder + folder + fileName)
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

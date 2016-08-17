// To demonstrate the benefits of a promise, lets take the problem of loading images in the browser
// The following shows an implementation using a Node style (error-first) callback

// Simple for one image
loadImageCallbacked('images/img4.jpg',
	(error, img) => {
		if (error) throw error
		let imgElement = document.createElement("img")
		imgElement.src = img.src
		document.body.appendChild(imgElement)
	})

// Now for multiple images
// We've composed the majority of the functionality into addImg
let addImg = (src) => { // This uses ES6 arrow function
	let imgElement = document.createElement("img")
	imgElement.src = img.src
	document.body.appendChild(imgElement)
}

// As you can see, as our application grows in complexity, so too does the code.
// This is what is known as the nodejs callback christmas tree of doom...
loadImageCallbacked('images/img1.jpg', (error, img) => {
	if (error) throw error
	addImg(img1.src)
	loadImageCallbacked('images/img2.jpg', (error, img) => {
		if (error) throw error
		addImg(img2.src)
		loadImageCallbacked('images/img3.jpg', (error, img) => {
			if (error) throw error
			addImg(img3.src)
		})
	})
})



// Here we are relying on having one callback bringing in another load, which brings in another callback
// What's even worse is that this is not parallel and is completely synchronous.
// To load these images in parallel, we would need an even more complex solution (not seen)


// USING ASYNC
// There are numerous abstractions built around the error-first callbacks,
// these are known as "errbacks"

// One way to solve the problem is with the async module
var mapAsync = require('async').map

var urls = [ 'images/img1.jpg', 'images/img2.jpg']
mapAsync(urls, loadImage, function (err, images) {
	if (err) throw err
	console.log('All images loaded', images)
})

// Similar abstractions exist independently on npm, such as:
// async-each, async-each-series, run-series, run-waterfall, map-limit

// This approach is great for small modules as it does not introduce additional bloat

// However, in a larger scope, promises can provide a unified and composable structure throughout
// your application. They also lay the groundwork for ES7 async/await


// PROMISES - lets try the above with promises for out control flow

function loadImageAsync(url) {
	return new Promise( function (resolve, reject) {
		var image = new Image()

		image.onload = function() {
			resolve(image)
		}

		image.onerror = function() {
			reject(new Error('Could not load image ' + url))
		}

		image.src = url
	})
}












// This is funfunfunction's version

function loadImage(url, callback) {
	let image = new Image() // JS constructor for an img element & can be appended to a document

	image.onload = function() {
		callback(null, image) // Typical structure for a callback is to begin with errors (if any)
	}

	image.onerror = function() {
		let message = 'Could not load image at ' + url
		callback(new Error(msg))
	}

	image.src = url
}

// Here we are now using ECMA6 promises and awaits...

function loadImage(url) { // Now we only need the
	// The Promise() constructor takes a single function as its arguments
	// This function in turn takes in two arguments, resolve and reject.
	// These are both function and JS wants you to only invoke them when you have the promised value.
	return new Promise((resolve, reject) => {

		let image = new Image()

		image.onload = function() {
			// Instead of calling the callback, we use resolve with ONLLYYYYY promised value (as its resolved!)
			resolve(image)
		}

		image.onerror = function() {
			let message = 'Could not load image at ' + url
			reject(new Error(message))
		}

	})

	image.src = url

}

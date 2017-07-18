const Event = require('../models/event')
var snoowrap 		= require('snoowrap')
var natural = require('natural')
var fs = require('fs');
var parse = require('csv-parse');

module.exports = {
	showEvents: showEvents,
	showSingle: showSingle,
	showCreate: showCreate,
	processCreate: processCreate,
	showEdit: showEdit,
	processEdit: processEdit,
	deleteEvent: deleteEvent
}

/**
* NLP stuff here
*/

var classifier = new natural.BayesClassifier();
var input = fs.readFileSync('twitter-hate.csv', 'utf8');

//Loads a classifier as saved.
natural.BayesClassifier.load('classifier.json', null, function(err, classifierLoad) {
    if (classifierLoad != undefined) {
        classifier = classifierLoad;
        
        console.log("on pause")
    }
    else { trainData(); }
});

function trainData() {
    parse(input, {comment: '#'}, function(err, output){
        console.log("Loading files");
        for (i = 1; i < 14500; i++) {
            if (i % 1000 == 0) { console.log(i); }

            classifier.addDocument(String(output[i][19]), String(output[i][5]));
        }

        console.log("Training files");
        classifier.train();
        console.log("Finished training");
        
        console.log("on pause")
    });
}

/**
* Show all events
*/
function showEvents(req, res) {
	//get all events
	Event.find({}, (err, events) => {
		if (err) {
			res.status(404)
			res.send('Events not found')
		}

		// return a view with data
		res.render('pages/events', {
			events: events,
			success: req.flash('success')
		})
	})
}

/**
* Show a single event
*/
function showSingle(req, res) {
	// get a single event
	Event.findOne({ slug: req.params.slug }, (err, event) => {
		if (err) {
			res.status(404)
			res.send('Events not found')
		}

		res.render('pages/single', {
			event: event,
			success: req.flash('success')
		})
	})
}

/**
* Show the create form
*/
function showCreate(req, res){
	res.render('pages/create', {
		errors: req.flash('errors')
	});
}

const r = new snoowrap({
	userAgent : process.env.userAgent,
	clientId : process.env.clientId,
	clientSecret : process.env.clientSecret,
	username : process.env.username,
	password : process.env.password
});

function processOverview(string) {
    var comments = []
    for (i = 0; i < string.length; i++){
        comments.push(string[i]['body'])
    }

    var text = ''
    var bitchIndex = 0

    for (i = 0; i < comments.length; i++){
        text = String(comments[i]).substring(0,1000)

        /* If a user quotes someone who is using hate speech, they are not
         penalized for hate speech. Currently fails the edge case of
         multiple paragraphs in one quote. Quotation notation in Reddit is
         '>' */
        text = text.split('\n')
        for (j = 0; j < text.length; j++){
            if (text[j][0] === '>'){
                text[j] = ''
            }
        }
        text = text.join(' ')

        //console.log(text)
        //console.log(classifier.classify(text))

        //Increment Bitch Index
        if (classifier.classify(text) === 'The tweet contains hate speech'){
            bitchIndex ++
        }

        //console.log(classifier.getClassifications(text))

        //  //Use this to save the classifier for later use
        // classifier.save('classifier.json', function(err, classifier) {
        //      // the classifier is saved to the classifier.json file!
        //      console.log("Classifier saved!");
        // })
    }
    bitch = (bitchIndex/string.length).toString()
    console.log('Naive Bayes Bitch Index: ' + bitch)
    return bitch
}
/**
* Process the creation form
*/
function processCreate(req, res){
	// validate information
	req.checkBody('name', 'Name is required.').notEmpty()
	//req.checkBody('description', 'Description is required.').notEmpty()

	// if there are errors, redirect and save errors to flash
	const errors = req.validationErrors()
	if (errors) {
		req.flash('errors', errors.map(err => err.msg))
		return res.redirect('/events/create')
	}

	var val;
	r.getUser(req.body.name).getComments().then(function(value){
		val = processOverview(value)
		console.log(val)
	}).catch(function(error){
		console.log(error)
	})

	/** here setTimeout waits 250 miliseconds.
	* it's only a temporary fix. It shows that "val" is not updating
	* but that it's totally okay to put mongo stuff inside a function
	* and call it
	*/
	function waitForElement(){
		console.log("passed")
	    if(val !== null){
			// create a new event
			console.log("flabbermonkey")
			console.log(val)
			const event = new Event({
				name: req.body.name,
				description: val
			})

			// save event
			event.save((err) => {
				if (err)
					throw err;

				// set a successful flash message
				req.flash('success', 'Successfully created Reddit user!')

				// redirect to the newly created event
				res.redirect(`/events/${event.slug}`)
			})
	    }
	}

	setTimeout(waitForElement, 250);

}

/**
* Show the edit form
*/
function showEdit(req, res) {
	Event.findOne({ slug: req.params.slug }, (err, event) => {
		res.render('pages/edit', {
			event: event,
			errors: req.flash('errors')
		})
	})
}

/**
* Process the edit form
*/
function processEdit(req, res) {
	// validate information
	req.checkBody('name', 'Name is required.').notEmpty()
	req.checkBody('description', 'Description is required.').notEmpty()

	// if there are errors, redirect and save errors to flash
	const errors = req.validationErrors()
	if (errors) {
		req.flash('errors', errors.map(err => err.msg))
		return res.redirect(`/events/${req.params.slug}/edit`)
	}

	// finding a current event
	Event.findOne({ slug: req.params.slug }, (err, event) => {
		// updating that event
		event.name 			= req.body.name;
		event.description 	= req.body.description

		event.save((err) => {
			if (err)
				throw err;

			// success flash message
			// redirect back to the /events
			req.flash('success', 'Successfully updated event.')
			res.redirect('/events')
		})
	})	
}

/**
* Delete an event
*/
function deleteEvent(req, res){
	Event.remove({ slug: req.params.slug }, (err) => {
		// set flash data
		// redirect back to the events page
		req.flash('success', 'Event deleted!')
		res.redirect('/events')
	})
}
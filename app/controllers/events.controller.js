const Event = require('../models/event')
var snoowrap = require('snoowrap')

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

function redditPromise(username){
	// Snoowrap API credentials, loads from DEV-API-CRED
	const r = new snoowrap({
	  userAgent: process.env.userAgent,
	  clientId: process.env.clientId,
	  clientSecret: process.env.clientSecret,
	  username: process.env.username,
	  password: process.env.password
	});

	// r.getUser(req.body.name).getComments().then(function(value){
	// 	return value
	// })
	return "need to implement"
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

	// create a new event
	const event = new Event({
		name: req.body.name,
		description: redditPromise(req.body.name)
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
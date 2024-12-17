const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate')
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Campground = require('./models/campground')

mongoose.connect('mongodb://localhost:27017/yelp-camp');

const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error: "));
db.once('open', () => {
	console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
	res.render('home')
})

//Gets a list of all campgrounds
app.get('/campgrounds', async (req, res) => {
	const campgrounds = await Campground.find({});
	res.render('campgrounds/index', { campgrounds })
})

//Gets the form for new campground
app.get('/campgrounds/new', async (req, res) => {
	res.render('campgrounds/new')
})

//Creates a new campground
app.post('/campgrounds', catchAsync(async (req, res, next) => {
	if (!req.body.campground) throw new ExpressError("Invalid Campground Data.", 400);
	const campground = new Campground(req.body.campground);
	await campground.save();
	res.redirect(`/campgrounds/${campground._id}`)
}))

//Gets a single campground by ID
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
	const campground = await Campground.findById(req.params.id)
	res.render('campgrounds/show', { campground })
}))

//Get a form for editing information of a single campground
app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
	const campground = await Campground.findById(req.params.id)
	res.render('campgrounds/edit', { campground })
}))

//Edits a single campground information
app.put('/campgrounds/:id', catchAsync(async (req, res) => {
	const { id } = req.params;
	const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
	res.redirect(`/campgrounds/${campground._id}`)
}))

//Delete a campground by ID
app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
	const { id } = req.params;
	await Campground.findByIdAndDelete(id);
	res.redirect('/campgrounds');
}))

app.all('*', (req, res, next) => {
	next(new ExpressError("Page Not Found", 404))
})

app.use((err, req, res, next) => {
	const { statusCode = 500 } = err;
	if (!err.message) err.message = "Oh no. Something went wrong!";
	res.status(statusCode).render('error.ejs', { err });
})

app.listen(3000, () => {
	console.log('Serving on port 3000.')
})
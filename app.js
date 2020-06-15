require('dotenv').config();

const createError = require('http-errors');
const favicon = require('serve-favicon');
const express = require('express');
const engine = require('ejs-mate');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('./db/passport');
const session = require('express-session');
const methodOverride = require('method-override');
// const seedPosts = require('./seeds');
// const { asyncErrorHandler } = require('./middleware/index');
// asyncErrorHandler(seedPosts());

// require ROUTES 
const indexRouter    = require('./routes/index');
const postsRouter    = require('./routes/posts');
const commentsRouter = require('./routes/comments');

const app = express();

app.engine('ejs', engine);
// view engine setup
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// app.locals is a means to adding moment to every view
app.locals.moment = require('moment');

// passport CONFIG
app.use(session({
  secret: "we the north",
  resave: false,
  saveUninitialized: true,
}));

// api key - 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

app.use(passport.initialize());
app.use(passport.session());

// set local variables middleware 
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  // set default page title
  res.locals.title = 'Beme';
  // set success flash message
  res.locals.success = req.session.success || '';
  delete req.session.success;
  // set error flash message
  res.locals.error = req.session.error || '';
  delete req.session.error;
  next();
});

// mount routes
app.use('/', indexRouter);
app.use('/posts', postsRouter);
app.use('/posts/:id/comments', commentsRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  // for some reason this was thjrowing a NOT FOUND error .. i guess it was 
  // pushing a createdError(404) down the stack not to be picked up by anything 

  // next(createError(404));
});

// error handler
// ** so this is added on last in the middleware stack .. so when we pass next(err) in
// our routes we are passing the error down the stack to the error handling middleware vv
// granted us by express-generator **
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  // res.status(err.status || 500);
  // res.render('error');
  console.log(err);
  req.session.error = err.message;
  res.redirect('back');
});

module.exports = app;
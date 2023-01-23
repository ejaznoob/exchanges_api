const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
var bodyParser = require('body-parser');
var multer = require('multer');
var forms = multer();
var passport = require('passport')

require('dotenv').config();
require('./modules/databases/mongo')();


var cors = require('cors')
require('./auth')

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/auth_routes');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(forms.array()); // multipart form data request
app.use(bodyParser.json()); // for parsing application/json

app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());

var ensureAuthenticated = function(req, res, next) {
  passport.authenticate('headerapikey', {
    failureRedirect: '/auth-fail',
    passReqToCallback : true,
  })(req, res, next);
}

app.use('/', indexRouter);
app.use(ensureAuthenticated);
app.use('/users', usersRouter);

app.use(cors())

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

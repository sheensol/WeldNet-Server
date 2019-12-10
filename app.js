// vendor libraries
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var path = require('path');
var passport = require('passport');
var cors = require('cors');
var LocalStrategy = require('passport-local').Strategy;
// routes
var user = require('./route/user');
// model
var Model = require('./model/model');
var forgot = require('password-reset')({
   uri : 'http://localhost:8080/password_reset',
   from : 'password-robot@localhost',
   host : 'localhost', port : 25,
});

var app = express();

passport.use(new LocalStrategy({
   // by default, local strategy uses username and password, we will override with email
   usernameField : 'Email',
   passwordField : 'Password',
   passReqToCallback : true // allows us to pass back the entire request to the callback
},function(req,Email, Password, done) {
   new Model.User({Email: Email}).fetch().then(function(data) {
      var user = data;
      if(user === null) {
         return done(null, false, {message: 'you are not registered or approved.'});
      } else {
         user = data.toJSON();
         if(!bcrypt.compareSync(Password, user.Password)) {
            return done(null, false, {message: 'Invalid password'});
         } else {
            return done(null, user);
         }
      }
   });
}));

passport.serializeUser(function(user, done) {
  done(null, user.Email);
});

passport.deserializeUser(function(Email, done) {
   new Model.User({Email: Email}).fetch().then(function(user) {
      done(null, user);
   });
});

app.set('port', process.env.PORT || 5000);
app.use(express.static('assets'));
app.use(forgot.middleware);
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json());
app.use(session({secret: 'secret strategic xxzzz code'}));
app.use(passport.initialize());
app.use(passport.session());


app.post('/signin', user.signInPost);
app.post('/signup', user.signUpPost);
app.post('/forgot', user.forgot);
app.post('/reset/:token', user.reset);
app.use(user.notFound404);

var server = app.listen(app.get('port'), function(err) {
   if(err) throw err;

   var message = 'Server is running @ http://localhost:' + server.address().port;
   console.log(message);
});

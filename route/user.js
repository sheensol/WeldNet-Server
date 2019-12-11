var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');
var Model = require('../model/model');
var validator = require('email-validator');
var fs = require('fs');
// app.use(require('sesame')());

var signInPost = function(req, res, next) {
   passport.authenticate('local', function(err, user, info) {
      if(err) {
         return res.json(err.message);
      }
      if(!user) {
         return res.json(info.message);
      }
      return req.logIn(user, function(err) {
         if(err) {
            return res.json(err.message);
         } else {
            return res.json('login success');
         }
      });
   })(req, res, next);
};

var signUpPost = function(req, res, next) {
  console.log(req);
   const { Name,Password,Company,Email,Address,Telephone} = req.body
   var usernamePromise = null;
   var companyPromise = null;
   if(validator.validate(Email)){
      if(Password.length > 2){
         companyPromise = new Model.Company({Name: Company}).fetch();
         return companyPromise.then(function(model) {
            if(model) {
               return res.json({'error': 'Company already exists'});
            } else {
               var signUpCompany = new Model.Company({Name:Company,Address:Address,Telephone:Telephone});
               signUpCompany.save().then(function(model) {
                  ID = model.ID;
                  // sign in the newly registered user
                  // signInPost(req, res, next);
                  usernamePromise = new Model.User({Email: Email}).fetch();
                  return usernamePromise.then(function(model) {
                     if(model) {
                       return res.json({'error': 'Email already exists'});
                     } else {
                        var password = Password;
                        var hash = bcrypt.hashSync(password);
                        var signUpUser = new Model.User({Name:Name,Email:Email,Active:false,Password:hash,Company_ID:ID});

                        signUpUser.save().then(function(model) {
                           // sign in the newly registered user
                           // signInPost(req, res, next);
                          // console.log(model);

                          user_ID = model.ID;
                          var users_company = new Model.User_Company({User_ID:user_ID,Company_ID:ID});
                          users_company.save().then(function(model) {

                          });


                           return res.json({message: 'Signup success. Please signin.'});
                        });



                     }
                  });
               });
            }
         });
      }
      else{
         res.json({'error': 'password must be longer than 8 characters'});
      }
   }
   else{
      res.json({'error': 'email is invalid'})
   }
};
// sign out
var signOut = function(req, res, next) {
   if(!req.isAuthenticated()) {
      notFound404(req, res, next);
   } else {
      req.logout();
      res.redirect('/signin');
   }
};
var forgot = function(req, res, next) {
   async.waterfall([
     function(done) {
       crypto.randomBytes(20, function(err, buf) {
         var token = buf.toString('hex');
         done(err, token);
       });
     },
     function(token, done) {
       User.findOne({ email: req.body.email }, function(err, user) {
         if (!user) {
           req.flash('error', 'No account with that email address exists.');
           return res.redirect('/forgot');
         }

         user.resetPasswordToken = token;
         user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

         user.save(function(err) {
           done(err, token, user);
         });
       });
     },
     function(token, user, done) {
       var smtpTransport = nodemailer.createTransport({
         host: "smtp.yandex.ru",
         port: 465,
         secure: true,
         auth: {
           user: 'test@test.ru',
           pass: 'qwerty'
         }
       });
       var mailOptions = {
         to: user.email,
         from: 'test@test.ru',
         subject: 'Node.js Password Reset',
         text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
           'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
           'http://' + req.headers.host + '/reset/' + token + '\n\n' +
           'If you did not request this, please ignore this email and your password will remain unchanged.\n'
       };
       console.log("suceful")
       smtpTransport.sendMail(mailOptions, function(err, info) {
         if (err) {
             console.log('Error occurred. ' + err.message);
             return process.exit(1);
         }
         console.log(info)
         req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
         done(err, 'done');
       });
     }
   ], function(err) {
     if (err) return next(err);
     res.redirect('/forgot');
   });
 };

 var reset =  function(req, res) {
   async.waterfall([
     function(done) {
       User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
         if (!user) {
           req.flash('error', 'Password reset token is invalid or has expired.');
           return res.redirect('back');
         }

         user.password = req.body.password;
         user.resetPasswordToken = undefined;
         user.resetPasswordExpires = undefined;

         user.save(function(err) {
           req.logIn(user, function(err) {
             done(err, user);
           });
         });
       });
     },
     function(user, done) {
       var smtpTransport = nodemailer.createTransport({
         host: "smtp.yandex.ru",
         port: 465,
         secure: true,
         auth: {
           user: 'test@test.ru',
           pass: 'qwerty'
         }
       });
       var mailOptions = {
         to: user.email,
         from: 'test@test.ru',
         subject: 'Your password has been changed',
         text: 'Hello,\n\n' +
           'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
       };
       smtpTransport.sendMail(mailOptions, function(err, info) {
         if (err) {
             console.log('Error occurred. ' + err.message);
             return process.exit(1);
         }
         console.log(info)
         req.flash('success', 'Success! Your password has been changed.');
         done(err);
       });
     }
   ], function(err) {
     res.redirect('/');
   });
 };
var notFound404 = function(req, res, next) {
   res.status(404);
   res.render('404', {title: '404 Not Found'});
};

module.exports.signInPost = signInPost;
module.exports.signUpPost = signUpPost;
module.exports.signOut = signOut;
module.exports.notFound404 = notFound404;
module.exports.forgot = forgot;
module.exports.reset = reset;

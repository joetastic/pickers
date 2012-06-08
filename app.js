
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , passport = require('passport');

var app = module.exports = express.createServer();

var redis = require('redis-url').connect(process.env.REDISTOGO_URL);

var getLocalStrategy = function() {
    var LocalStrategy = require('passport-local').Strategy;
    return new LocalStrategy(
        function(username, password, done) {
            var identifier = 'local:' + username;
            var user = {
                "displayName": username
            };
            redis.set(identifier, user);
            return done(null, {
                "identifier": identifier,
                "user": user
            });
        });
};

var getGoogleStrategy = function() {
    var GoogleStrategy = require('passport-google').Strategy;
    return new GoogleStrategy(
        {
            returnURL: 'http://localhost:3000/auth/google/return',
            realm: 'http://localhost:3000/'
        },
        function(identifier, profile, done) {
            redis.set(identifier, profile);
            return done(null, {
                "identifier": identifier,
                "user": profile
            });
        }
    );
};

passport.use(getLocalStrategy());
passport.use(getGoogleStrategy());

var RedisStore = require('connect-heroku-redis')(express);

passport.serializeUser(function(user, done) {
    done(null, user.identifier);
});

passport.deserializeUser(function(identifier, done) {
    redis.get(identifier, function(err, profile) {
        done(null, profile);
    });
});

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
    app.set('view options', {layout: false});
    app.use(express.cookieParser());
  app.use(express.bodyParser());
    app.use(express.session({store: new RedisStore, secret: 'caturday'}));
    app.use(passport.initialize());
    app.use(passport.session());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', ensureAuthenticated, routes.index);
app.get('/login', function(req, res) {
    res.render('signin', {title: 'Pickers'});
});
app.post('/login',
         passport.authenticate('local', { successRedirect: '/',
                                          failureRedirect: '/login',
                                          failureFlash: true })
        );

app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return',
        passport.authenticate('google', { successRedirect: '/',
                                          failureRedirect: '/login' }));
app.get('/logout', function(req, res){
    req.logOut();
    res.redirect('/');
});


app.get('/pick', ensureAuthenticated, routes.pick);
app.post('/pick', ensureAuthenticated, routes.pickSubmit);
app.get('/admin', ensureAuthenticated, routes.admin);
app.post('/admin', ensureAuthenticated, routes.adminSubmit);
app.get('/admin/bumpweek', ensureAuthenticated, function(req, res) {
    redis.incr('curweek');
    res.redirect('/admin');
});
app.get('/admin/eliminate/:eliminate', ensureAuthenticated, routes.adminEliminate);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}

app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , passport = require('passport');

var app = module.exports = express.createServer();

var redis = require('redis-url').connect();

var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
    function(username, password, done) {
        return done(null, username);
    }));

var RedisStore = require('connect-redis')(express);

passport.serializeUser(function(username, done) {
    done(null, username);
});

passport.deserializeUser(function(username, done) {
    done(null, username);
});

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
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

app.get('/pick', ensureAuthenticated, routes.pick);
app.get('/pick/:pick', ensureAuthenticated, routes.pickSubmit);
app.get('/admin', ensureAuthenticated, routes.admin);
app.post('/admin', ensureAuthenticated, routes.adminSubmit);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

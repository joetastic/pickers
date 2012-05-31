var redis = require('redis-url').connect();

/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index', { title: 'Express' });
};

exports.pick = function(req, res){
    if(req.query.flush) {
        redis.del('picks.' + req.user);
    }
    redis.lrange('picks.' + req.user, 0, -1, function(err, picks) {
        console.log("got picks", picks);
        if(picks.length == 0) {
            redis.lrange('contestants', 0, -1, function(err, contestants) {
                res.render('pick', { title: 'Express', user: req.user, contestants: contestants });
            });
        } else {
            res.render('pick', { title: 'Express', user: req.user, contestants: picks });
        }
    });
};

exports.pickSubmit = function(req, res){
    var m = redis.multi();
    /*
    req.body.pick.forEach(function(ob, i) {
        console.log(i, ob);
        m.lpush("picks." + req.user, ob);
    });
    */

    var pushargs = req.body.pick;
    pushargs.reverse();
    pushargs.unshift("picks." + req.user);
    m.lpush(pushargs);
    m.exec(function(err, replies) {
        res.redirect('/pick');
    });
};

exports.admin = function(req, res){
    redis.lrange('contestants', 0, -1, function(err, contestants) {
        res.render('admin', { title: 'Express', contestants: contestants });
    });
};

exports.adminSubmit = function(req, res){
    redis.lpush('contestants', req.body.contestant);
    res.redirect('/admin');
};

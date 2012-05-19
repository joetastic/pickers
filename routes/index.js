var redis = require('redis-url').connect();

/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index', { title: 'Express' });
};

exports.pick = function(req, res){
    redis.multi()
        .lrange('contestants', 0, -1)
        .lrange('picks.' + req.user, 0, -1)
        .exec(function(err, replies) {
            //diff contestants - picks
            var contestants = replies[0].filter(function(i) {return !(replies[1].indexOf(i) > -1);});
            res.render('pick', { title: 'Express', user: req.user, contestants: contestants, picks: replies[1] });
        });
};

exports.pickSubmit = function(req, res){
    redis.lpush('picks.' + req.user, req.params.pick);
    res.redirect('/pick');
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

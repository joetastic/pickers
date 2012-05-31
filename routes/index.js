var redis = require('redis-url').connect();

/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index', { title: 'Express' });
};

exports.pick = function(req, res){
    redis.get('curweek', function(err, curweek) {
        var pickKey = 'picks.' + curweek + '.' + req.user;
        console.log("pickKey", pickKey);
        if(req.query.flush) {
            redis.del(pickKey);
        }

        redis.lrange(pickKey, 0, -1, function(err, picks) {
            console.log("picks", picks);
            var renderPicks = function(err, contestants, has_picked) {
                res.render('pick', {
                    title: 'Express',
                    user: req.user,
                    contestants: contestants,
                    curweek: curweek,
                    has_picked: has_picked
                });
            };

            if(picks.length == 0) {
                redis.lrange('contestants', 0, -1, renderPicks);
            } else {
                renderPicks(null, picks, true);
            }
        });
    });
};

exports.pickSubmit = function(req, res){
    redis.get('curweek', function(err, curweek) {
        var pickKey = 'picks.' + curweek + '.' + req.user;
        var pushargs = req.body.pick;
        pushargs.reverse();
        pushargs.unshift(pickKey);
        redis.lpush(pushargs, function(err, replies) {
            res.redirect('/pick');
        });
    });
};

exports.admin = function(req, res){
    var multi = redis.multi();
    multi.get('curweek')
        .lrange('contestants', 0, -1)
        .exec(function(err, replies) {
            var curweek = replies[0];
            var contestants = replies[1];
            res.render('admin', { title: 'Express', contestants: contestants, curweek: curweek || 0 });
        });
};

exports.adminSubmit = function(req, res){
    redis.lpush('contestants', req.body.contestant);
    res.redirect('/admin');
};

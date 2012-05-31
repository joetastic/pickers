var redis = require('redis-url').connect()
, util = require('util');

/*
 * GET home page.
 */

exports.index = function(req, res){
    redis.get('curweek', function(err, curweek) {
        var multi = redis.multi();
        for(var i=0; i < curweek; i++) {
            var keyexpr = 'picks.' + i + '.*';
            multi.keys(keyexpr);
        }
        multi.exec(function(err, weeks) {
            var picks = []
            var kmulti = redis.multi();
            weeks.forEach(function(keys) {
                keys.forEach(function(key) {
                    kmulti.lrange(key, 0, -1, function(err, ob) {
                        var parts = key.split('.');
                        picks.push({
                            user: parts[2],
                            week: parts[1],
                            picks: ob
                        });
                    });
                });
            })
            kmulti.exec(function(err, ob) {
                res.render('index', { title: 'Express', picks: picks });
            });
        });
    });
};

exports.pick = function(req, res){
    redis.get('curweek', function(err, curweek) {
        var pickKey = 'picks.' + curweek + '.' + req.user;
        if(req.query.flush) {
            redis.del(pickKey);
        }

        redis.lrange(pickKey, 0, -1, function(err, picks) {
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

exports.adminEliminate = function(req, res) {
    redis.lrem('contestants', 0, req.params.eliminate, function(err) {
        res.redirect('/admin');
    });
}

exports.adminSubmit = function(req, res){
    redis.lpush('contestants', req.body.contestant);
    res.redirect('/admin');
};

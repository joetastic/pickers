
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};

exports.pick = function(req, res){
  res.render('pick', { title: 'Express' })
};

exports.pickSubmit = function(req, res){
  res.render('pick', { title: 'Express' })
};

exports.admin = function(req, res){
  res.render('admin', { title: 'Express' })
};

exports.adminSubmit = function(req, res){
  res.render('admin', { title: 'Express' })
};

var express = require('express');
var getRouter = express.Router();

getRouter.get('/admin', function (req, res) {
   if (req.cookies.authorized) {
       res.render('admin', {content: '带cookie登陆成功！'});
   } else {
       res.redirect('/login');
   }
});

exports.get = getRouter;
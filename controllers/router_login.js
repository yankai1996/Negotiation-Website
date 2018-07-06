const express = require('express');
const getRouter = express.Router();
const postRouter = express.Router();
const auth = require('./auth');

// root url
getRouter.get('/', auth.checkAuth);
getRouter.get('/', (req, res) => {
    res.redirect('/login');
});

getRouter.get('/login', (req, res) => {
    res.render('login', {flag: 0});
});

postRouter.post('/login', auth.authenticate);
postRouter.post('/login', auth.clearCookie);
postRouter.post('/login', auth.authFail);

// log out
getRouter.get('/logout', auth.clearCookie);
getRouter.get('/logout', (req, res) => {
    res.redirect('/login');
});


exports.get = getRouter;
exports.post = postRouter;
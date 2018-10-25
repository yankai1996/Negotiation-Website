const express = require('express');
const browser = require('browser-detect');
const getRouter = express.Router();
const postRouter = express.Router();
const auth = require('./auth');

// root url
getRouter.get('/', (req, res) => {
    res.redirect('/login');
});

getRouter.get('/login', (req, res) => {
    const result = browser(req.headers['user-agent']);
    var name = result.name;
    if (name != 'chrome' && name != 'safari' && name != 'firefox' && name != 'opera') {
        console.log(name);
        res.send("This website is not supported by your browser!");
    } else {
        res.render('login', {flag: 0});
    }
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
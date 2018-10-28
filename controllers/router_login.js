const express = require('express');
const browser = require('browser-detect');
const getRouter = express.Router();
const postRouter = express.Router();
const auth = require('./auth');

// root url
getRouter.get('/', (req, res) => {
    res.redirect('/login');
});

const compatibleBrowser = (info) => {
    switch (info && info.name) {
        case 'chrome':
            if (info.versionNumber > 16) {
                return true;
            }
        case 'safari':
            if (info.versionNumber > 7) {
                return true;
            }
        case 'firefox':
            if (info.versionNumber > 11) {
                return true;
            }
        case 'opera':
            if (info.versionNumber > 12.1) {
                return true;
            }
    }
    return false;
}

getRouter.get('/login', (req, res) => {
    const info = browser(req.headers['user-agent']);
    if (!compatibleBrowser(info)) {
        res.send("<p>This website is not supported by your browser!</p>" + 
            "<p>Please use the latest Chrome/Safari/Firefox/Opera.</p>");
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
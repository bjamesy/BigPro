const db = require('../db/index');
// const passport = require('passport');
const passport = require('../db/passport');
const bcrypt     = require('bcrypt')
    , saltRounds = 10;

module.exports = {
    asyncErrorHandler: (fn) => 
        (req, res, next) => {
            Promise.resolve(fn(req, res, next))
                   .catch(next);
        },
    isCommentAuthor: async(req, res, next) => {
        let sql = 'SELECT * FROM comment WHERE id = $1';
        let params = [req.params.comment_id];
        const { rows } = await db.query(sql, params);

        if(rows && (rows[0].user_id === req.user.id)) {
            return next();
        }
        req.session.error = 'Not authorized, sorry!';
        return res.redirect('/');
    },
    isLoggedIn: (req, res, next) => {
        if (req.isAuthenticated()) return next();
        req.session.error = 'You need to be logged in to do that!';
        req.session.redirectTo = req.originalUrl;
        res.redirect('/login');
    },
    isAuthor: async (req, res, next) => {
        let sql = 'SELECT * FROM post WHERE id = $1';
        let params = [req.params.id];
        const { rows } = await db.query(sql, params);
        const posts = rows[0];

        if (req.user && (posts.user_id === req.user.id)) {
            res.locals.posts = posts;
            return next();
        }
        req.session.error = 'Access denied!';
        return res.redirect('back');    
    },
    isValidPassword: async (req, res, next) => {
        // check the two variables im passing in to see if theyre not already being taken by 'local' config
        const { currentPassword } = req.body;
        const { username } = req.user;
        // restructured so passport local config can read   
        req.body.username = username;
        req.body.password = currentPassword;

        passport.authenticate('local', function(err, user) {
            if (user) {
                res.locals.user = user;
                next();
            } else {
                req.session.error = 'Incorrect current password';
                return res.redirect('/profile');
            }
        })(req, res, next);
    },
    changePassword: async (req, res, next) => {
        const {
            newPassword,
            passwordConfirmation
        } = req.body;

        if(newPassword && !passwordConfirmation) {
            req.session.error = 'Missing password configuration';
            return res.redirect('/profile');
        } else if(newPassword && passwordConfirmation) {
            const { user } = res.locals;
            if(newPassword === passwordConfirmation) {
                const hashedPass = await bcrypt.hash(newPassword, saltRounds);
                await db.query('UPDATE "user" SET password = $1 WHERE id = $2', [hashedPass, user.id]);
                next();
            } else {
                req.session.error = 'New passwords must be the same!';
                return res.redirect('/profile');
            }
        } else {
            next();
        }
    }
}
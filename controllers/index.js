const passport   = require('../db/passport');
const db         = require('../db/index');
const util       = require('util');
const bcrypt     = require('bcrypt')
    , saltRounds = 10;

module.exports = {
    // GET /register
    getRegister(req, res, next) {
        res.render('register', { title: 'Register', username: '', email: '' });
    },
    // POST /register
    async postRegister(req, res, next) {
        try {
            const hash = await bcrypt.hash(req.body.password, saltRounds);
            let sql = 'INSERT INTO "user" (username, email, password, created_date) VALUES($1, $2, $3, $4) returning *';
            let params = [
                req.body.username, 
                req.body.email,
                hash,
                new Date()
            ];      
            const { rows } = await db.query(sql, params);
            const user = rows[0];
    
            req.login(user, function(err){
                if (err) return next(err);
                req.session.success = `Welcome to Beme, ${ user.username }!`;
                res.redirect('/');
            })    
        } catch (err) {
            const { username, email } = req.body;
            let error = err.message;
            // USERNAME error: duplicate key value violates unique constraint "user_username_key"
            if (error.includes('duplicate') && error.includes('violates unique constraint "user_username_key"')) {
                error = 'A user with that username is already registered'
            }            
            // EMAIL error: duplicate key value violates unique constraint "user_email_key"
            if (error.includes('duplicate') && error.includes('violates unique constraint "user_email_key"')) {
                error = 'A user with that email is already registered'
            }
            res.render('register', { title: 'Register', username, email, error });
        }
    }, 
    // GET /login
    getLogin(req, res, next) {
        if(req.isAuthenticated()) return res.redirect('/');
        if(req.query.returnTo) req.session.redirectTo = req.headers.referer;
        res.render('login', { title: 'Login' });
    }, 
    // POST /login
    async postLogin(req, res, next) {
        passport.authenticate('local', function(err, user) {
            if (!user && err) return next(err);
            req.login(user, function(err) {
                if(err) return next(err);
                req.session.success = `Welcome back, ${ user.username }`;
                const redirectUrl = req.session.redirectTo || '/';
                delete req.session.redirectTo;
                res.redirect(redirectUrl); 
            });
        })(req, res, next);
    },
    // POST /logout
    getLogout(req, res, next) {
        req.logout();
        res.redirect('/');
    },
    // GET /profile
    async getProfile(req, res, next) {
        let sql = 'SELECT * FROM post WHERE user_id = $1 LIMIT 10';
        let params = [req.user.id];
        const { rows } = await db.query(sql, params);

        res.render('profile', {
            title: 'Profile',
            posts: rows
        });
    },
    // UPDATE PROFILE 
    async updateProfile(req, res, next) {
        const { changedUsername, email } = req.body;
        const { user } = res.locals;
        
        if((changedUsername !== user.username) || (email !== user.email)) {
            user.username = changedUsername;
            user.email = email;        
            let sql = 'UPDATE "user" SET username = $1, email = $2 WHERE id = $3';
            let params = [
                user.username,
                user.email,
                user.id 
            ];
            await db.query(sql, params);
        }

        const login = util.promisify(req.login.bind(req));
        await login(user);
        req.session.success = 'Profile successfully updated'; 
        res.redirect('/profile');
    }
}
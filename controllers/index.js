const passport   = require('../db/passport');
const db         = require('../db/index')
    , { Pool }   = require('pg')
    , pool       = new Pool();
const util       = require('util');
const bcrypt     = require('bcrypt')
    , saltRounds = 10;
const crypto     = require('crypto');
const sgMail     = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
                Date.now()
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
    },
    getForgotPw(req, res, next) {
        res.render('users/forgot');
    },
    async putForgotPw(req, res, next) {
        const client = await pool.connect(); 
        try {
            await client.query('BEGIN');
            const token = await crypto.randomBytes(20).toString('hex');

            const { email } = req.body;
            let sql = 'SELECT * FROM "user" WHERE email = $1';
            let params = [email];
            const { rows } = await client.query(sql, params);
            
            if (!rows[0]){
                req.session.error = 'No account with that email exists.';
                return res.redirect('/forgot-password');
            }    

            let updateSql = 'UPDATE "user" SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3 returning *';
            let updateParams = [
                token, 
                Date.now() + 3600000,
                rows[0].id
            ];
            const result = await client.query(updateSql, updateParams);

            const msg = {
                to: email,
                from: 'Beme Admin <james_ballanger_2@hotmail.com>',
                subject: 'Beme - Forgot Password / Reset',
                text: `You are receiving this because you (or someone else) have requested 
                the reset of the password for your account. Please click on the following 
                link, or copy and paste it into your browser to complete the process:
                http://${req.headers.host}/reset/${token}
                If you did not request this, please ignore this email and your password will
                remain unchanged.`.replace(/                /g, '')
                // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
            };
            await sgMail.send(msg);
            await client.query('COMMIT');

            req.session.success = `An email has been sent to ${email} with further instructions.`;
            res.redirect('/forgot-password');
        } catch (err) {
            await client.query('ROLLBACK');
            next(err);
        } finally {
            await client.release();
        }
    }, 
    async getReset(req, res, next) {
        const { token } = req.params;
        let sql = 'SELECT * FROM "user" WHERE reset_password_token = $1 AND reset_password_expires > $2';
        let params = [
            token,
            Date.now()
        ];
        const { rows } = await db.query(sql, params);
        const user = rows[0];

        if (!user) {
            req.session.error = 'Password reset token is invalid or has expired';
            return res.redirect('/forgot-password');
        };

        res.render('users/reset', { token });
    },
    async putReset(req, res, next) {
        const client = await pool.connect(); 
        try {
            await client.query('BEGIN');

            const { token } = req.params;
            let sql = 'SELECT * FROM "user" WHERE reset_password_token = $1 AND reset_password_expires > $2';
            let params = [
                token,
                Date.now()
            ];
            const { rows } = await client.query(sql, params);
            const user = rows[0];

            if (!user) {
                req.session.error = 'Password reset token is invalid or has expired';
                return res.redirect('/forgot-password');
            }; 
    
            if (req.body.password === req.body.confirm) {
                const hash = await bcrypt.hash(req.body.password, saltRounds);
                let updateSql = 'UPDATE "user" SET reset_password_token = $1, reset_password_expires = $2, password = $3 WHERE id = $4';
                let updateParams = [
                    null, 
                    null, 
                    hash,
                    user.id
                ];
                await client.query(updateSql, updateParams);
                const login = util.promisify(req.login.bind(req));
                await login(user);
            } else {
                req.session.error = 'Passwords do not match';
                return res.redirect(`/reset/${ token }`)
            }
    
            const msg = {
                to: user.email,
                from: 'Beme Admin <james_ballanger_2@hotmail.com>',
                subject: 'Beme - Forgot Password / Reset',
                text: `You are receiving this because you (or someone else) have requested 
                the reset of the password for your account. Please click on the following 
                link, or copy and paste it into your browser to complete the process:
                http://${req.headers.host}/reset/${token}
                If you did not request this, please ignore this email and your password will
                remain unchanged.`.replace(/                /g, '')
                // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
            };
            await sgMail.send(msg);
            await client.query('COMMIT');
    
            req.session.success = 'Password successfully updated!';
            res.redirect('/');    
        } catch (err) {
            await client.query('ROLLBACK');
            next(err);
        } finally {
            await client.release();
        }
    }
}
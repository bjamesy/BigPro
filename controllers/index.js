const { Pool }   = require('pg');
const passport = require('passport');
const db         = require('../db/index');
const bcrypt     = require('bcrypt')
    , saltRounds = 10;

module.exports = {
    async postRegister(req, res, next) {
        const hash = await bcrypt.hash('Chancie#12', saltRounds);
        let sql = 'INSERT INTO "user" (username, email, password, created_date) VALUES($1, $2, $3, $4) returning *';
        let params = [
            req.body.username, 
            req.body.email,
            hash,
            new Date()
        ];      
        const result = await db.query(sql, params);

        console.log('user registered!'); 
        return res.status(201).send(result.rows[0]);
    }, 

    postLogin(req, res, next) {
        passport.authenticate('local', {
            successRedirect: "/",
            failureRedirect: "/login"
        })(req, res, next);
    },
    
    getLogout(req, res, next) {
        req.logout();
        res.redirect('/');
    }
}
const express          = require('express');
const { Pool, Client}  = require('pg');
const LocalStrategy    = require('passport-local').Strategy;
const bcrypt           = require('bcrypt'),
      SALT_WORK_FACTOR = 10;

module.exports = {
    userRegister(req, res, next){
        const pool = new Pool()

        (async () => {
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                const { rows } = await client.query('SELECT * FROM user WHERE username = req.body.username RETURNING username;');

                if (rows[0].username === null) {
                    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
                    const hash = await bcrypt.hash(req.body.password, salt);

                    let params = [req.body.username, hash];
                    let sql = "INSERT INTO user(username, password) VALUES ($1, $2);";   

                    await client.query(sql, params);

                    await client.query('COMMIT');
                } 
                res.redirect('back', { 
                        flashMessage: "looks like an account with that username already exists - either choose diff username , or 'forget password' option" 
                    });
            }
            catch (err) {
                console.log('SIGN UPP ERROR: ', err);
                client.query('ROLLBACK');
                res.redirect('back');
            }
            finally {
                client.release();
                console.log('client Released');
            }
        })
    },
    userLogin(req, res, next) {
        const pool = new Pool();

        (async () => {
            const client = await pool.connect(); 

            try {
                const { rows } = await client.query('SELECT * FROM user WHERE username = req.body.username RETURNING username, password;');
                // check username 
                // check hashed password 
                if(rows[0].username != null) {
                    res.redirect('home', { flashMessage: 'username and password exist!'});
                    console.log(rows[0].username);
                    return;
                }
            } 
            catch (err) {
                console.log('SIGN IN ERROR: ', err);
                res.redirect('back', { flashMessage: 'sign in failed'});
            }    
        })
    }
}
const { Pool }   = require('pg');
const db         = require('../db/index');
const passport   = require('../db/passport');
const bcrypt     = require('bcrypt')
    , saltRounds = 10;

module.exports = {
    async postRegister(req, res, next) {
        try {
            const hash = await bcrypt.hash('Chancie#12', saltRounds);
            const sql = 'INSERT INTO "user" (username, email, password, created_date) VALUES ($1, $2, $3, $4) returning *';
            const params = [
                'darealbjamesy', 
                'jamesballanger@trentu.ca', 
                hash,
                new Date()
            ];      
            const result = await db.query(sql, params);

            console.log('user registered!'); 
            return res.status(201).send(result.rows[0]);
        } catch(err) {
            console.log(err);
            return res.status(400).send(err);
        }
    }
}
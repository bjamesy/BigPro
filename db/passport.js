const passport         = require('passport')
    , LocalStrategy    = require('passport-local');
const bcrypt           = require('bcrypt');
const db               = require('../db')

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const result = await db.query('SELECT id, username, password FROM "user" WHERE username=$1', [username]);
        const user = result.rows[0];
        if(result.rows.length > 0) {
            const match = await bcrypt.compare(password, user.password);
            if(match) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } 
        return done(null, false);
    } catch (err) {
        return done(err); 
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id)
});
    
passport.deserializeUser((id, done) => {
    db.query('SELECT id, username FROM "user" WHERE id = $1', [parseInt(id, 10)])
        .then(result => {
            done(null, result.rows[0]);
        })    
        .catch(err => {
            return done(err);
        });
});  

module.exports = passport;
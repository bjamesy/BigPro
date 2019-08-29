const passport         = require('passport')
    , LocalStrategy    = require('passport-local');
const bcrypt           = require('bcrypt');
const db               = require('../db')

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const { rows } = await db.query('SELECT id, username, password, email FROM "user" WHERE username = $1', [username]);
        const user = rows[0];

        if(rows.length > 0) {
            const match = await bcrypt.compare(password, user.password);
            if(match) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        };
        return done(null, false);
    } catch (err) {
        return done(err); 
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id)
});
    
passport.deserializeUser((id, done) => {
    db.query('SELECT id, username, email FROM "user" WHERE id = $1', [parseInt(id, 10)])
        .then(result => {
            done(null, result.rows[0]);
        })    
        .catch(err => {
            return done(err);
        });
});  

module.exports = passport;
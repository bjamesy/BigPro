const passport         = require('passport')
    , LocalStrategy    = require('passport-local');
const bcrypt           = require('bcrypt');

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const result = await query('SELECT id, username, password, type FROM users WHERE username=$1', [username]);
        if(result.rows.length > 0) {
            const match = await bcrypt.compare(password, result.rows[0].password);
            if(match) {
                return done(null, result);
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
    query('SELECT id, username FROM users WHERE id = $1', [parseInt(id, 10)])
        .then(result => {
            done(null, {
                user: result.rows[0]
            });
        })    
        .catch(err => {
            return done(err);
        });
});  

module.exports = passport;
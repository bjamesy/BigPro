const db =  require('../db');

module.exports  = {
    create(req, res, next) {
        (async () => {
            const text = `INSERT INTO
                "user"(username, email, password, created_date);
                VALUES($1, $2, $3, $4)
                returning *`;
            const values = [
                req.body.username,
                req.body.email,
                // req.body.password, HASH
                // moment(new Date()),
            ];
        
            try {
                const { rows } = await db.query(text, values);
                return res.status(201).send(rows[0]);
            } catch (err) {
                return res.status(400).send(err);
            }
        })
    },    
    register(req, res, next){
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
                    return res.render('/home', { flashMessage: "properly registered !"});
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
    login(req, res, next) {
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
    },
    delete(req, res, next) {
        (async () => {
            const deleteQuery = 'DELETE FROM "user" WHERE id=$1 returning *';
            try {
                const { rows } = await db.query(deleteQuery, [req.params.id]);
                if(!rows[0]) {
                    return res.status(404).send({'message': 'reflection not found'});
                }
                return res.status(204).send({ 'message': 'deleted' });
            } catch(err) {
                return res.status(400).send(err);
            }
        })  
    }      
}
const db = require('../db');
const { Pool }   = require('pg');
const pool = new Pool();

module.exports  = {
    // Posts Index
    async postIndex(req, res, next) {
        let sql = 'SELECT * FROM post';
        const { rows, rowCount } = await db.query(sql);

        return res.render('posts/index', { posts: rows, rowCount })
    },
    // Posts New
    postNew(req, res, next) {
        res.render('posts/new')
    },
    // Posts Create
    async postCreate(req, res, next) {
        let sql = 'INSERT INTO post(title, description, created_date, modified_date) VALUES($1, $2, $3, $4) returning *';
        let params = [
            req.body.title,
            // req.body.user_id,
            req.body.description,
            new Date(),
            new Date()
        ];
        const { rows } = await db.query(sql, params);

        return res.redirect(`/posts/${rows[0].id}`);
        // return res.redirect(201).send(rows[0]);
    },
    // Posts Show
    async postShow(req, res, next) {
        let sql = 'SELECT * FROM post WHERE id = $1';
        let params = [req.params.id];
        
        const { rows } = await db.query(sql, params);
        
        return res.render('posts/show', { post: rows[0] });
    },
    // Posts edit
    async postEdit(req, res, next) {
        let sql = 'SELECT * FROM post WHERE id = $1';
        let params = [req.params.id];

        const { rows } = await db.query(sql, params);
        return res.render('posts/edit', { post: rows[0] });
    },
    // Posts Update
    async postUpdate(req, res, next) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            let text = ('SELECT * FROM post WHERE id = $1');
            await client.query(text, [req.params.id]);

            let sql = 'UPDATE post SET title = $2, description = $3, modified_date = $4 WHERE id = $1 returning *';
            let params = [req.params.id, req.body.title, req.body.description, new Date()];
            const { rows } = await client.query(sql, params);
            await client.query('COMMIT');    

            res.redirect(`/posts/${rows[0].id}`);
        } catch (err) {
            await client.query('ROLLBACK');
            next(err);
        } finally {
            client.release();
        }
    },
    getOne(req, res, next) {
        (async () => {
            const text = 'SELECT * FROM post WHERE id = $1';
            try {
                const { rows } = await db.query(text, [req.params.id]);
                if (!rows[0]) {
                    return res.status(404).send({'message': 'reflection not found'});
                }
                return res.status(200).send(rows[0]);
            } catch(err) {
                return res.status(400).send(err)
            }
        })  
    },
    update(req, res, next) {
        (async () => {
            const findOneQuery = 'SELECT * FROM reflections WHERE id=$1';
            const updateOneQuery =`UPDATE reflections
                SET success=$1,low_point=$2,take_away=$3,modified_date=$4
                WHERE id=$5 returning *`;
            try {
                const { rows } = await db.query(findOneQuery, [req.params.id]);
                if(!rows[0]) {
                    return res.status(404).send({'message': 'reflection not found'});
                }
                const values = [
                    req.body.success || rows[0].success,
                    req.body.low_point || rows[0].low_point,
                    req.body.take_away || rows[0].take_away,
                    moment(new Date()),
                    req.params.id
                ];
                const response = await db.query(updateOneQuery, values);
                return res.status(200).send(response.rows[0]);
            } catch(err) {
                return res.status(400).send(err);
            }
        })    
    },
    delete(req, res, next) {
        (async () => {
            const deleteQuery = 'DELETE FROM reflections WHERE id=$1 returning *';
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
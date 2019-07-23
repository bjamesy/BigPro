const db         = require('../db')
    , { Pool }   = require('pg')
    , pool       = new Pool();
const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'dlqcz2pyj',
    api_key: '634512344588652',
    api_secret: process.env.CLOUDINARY_SECRET
});

module.exports  = {
    // Posts Index
    async postIndex(req, res, next) {
        // let sql = 'SELECT * FROM post LEFT JOIN image ON post.id = image.post_id';
        let postQuery = 'SELECT * FROM post';
        const postRes = await db.query(postQuery);

        let imageQuery = 'SELECT * FROM image';
        const imageRes = await db.query(imageQuery);

        return res.render('posts/index', { posts: postRes.rows, images: imageRes.rows });
    },
    // Posts New
    postNew(req, res, next) {
        return res.render('posts/new')
    },
    // Posts Create
    async postCreate(req, res, next) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let postQuery = 'INSERT INTO post(title, description, created_date, modified_date) VALUES($1, $2, $3, $4) returning *';
            let params = [
                req.body.title,
                // req.body.user_id,
                req.body.description,
                new Date(),
                new Date()
            ];
            const { rows } = await client.query(postQuery, params);

            for(const file of req.files) {
                let image = await cloudinary.v2.uploader.upload(file.path);
                let images = {
                    url: image.secure_url,
                    public_id: image.public_id
                };

                let imageQuery = 'INSERT INTO image(url, public_id, post_id) VALUES($1, $2, $3)';
                let params = [
                    images.url, 
                    images.public_id, 
                    rows[0].id
                ];
                await client.query(imageQuery, params);    
            };

            await client.query('COMMIT');
            res.redirect(`/posts/${rows[0].id}`);    
        } catch(err) {
            await client.query('ROLLBACK');
            next(err);
        } finally {
            client.release();
        }
    },
    // Posts Show
    async postShow(req, res, next) {
        let sql = 'SELECT * FROM post LEFT JOIN image ON image.post_id = post.id WHERE id = $1';
        let params = [req.params.id];
        
        const { rows } = await db.query(sql, params);
        
        return res.render('posts/show', { posts: rows });
    },
    // Posts edit
    async postEdit(req, res, next) {
        let sql = 'SELECT * FROM post LEFT JOIN image ON image.post_id = post.id WHERE id = $1';
        let params = [req.params.id];

        const { rows } = await db.query(sql, params);
        return res.render('posts/edit', { posts: rows });
    },
    // Posts Update
    async postUpdate(req, res, next) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            let findOneSQL = 'SELECT * FROM post WHERE id = $1';
            let params = [req.params.id];
            const { rows } = await client.query(findOneSQL, params);

            let updateOneSQL = 'UPDATE post SET title = $2, description = $3, modified_date = $4 WHERE id = $1 returning *';
            let params1 = [
                req.params.id, 
                req.body.title || rows[0].title, 
                req.body.description || rows[0].description, 
                new Date()
            ];
            const result = await client.query(updateOneSQL , params1);
            await client.query('COMMIT');    

            res.redirect(`/posts/${result.rows[0].id}`);
        } catch (err) {
            await client.query('ROLLBACK');
            next(err);
        } finally {
            client.release();
        }
    },
    async postDestroy(req, res, next) {
        let sql = "DELETE FROM post WHERE id = $1";
        let params = [req.params.id];
        await db.query(sql, params);
        return res.redirect('/posts')
    },
    // update(req, res, next) {
    //     (async () => {
    //         const findOneQuery = 'SELECT * FROM reflections WHERE id=$1';
    //         const updateOneQuery =`UPDATE reflections
    //             SET success=$1,low_point=$2,take_away=$3,modified_date=$4
    //             WHERE id=$5 returning *`;
    //         try {
    //             const { rows } = await db.query(findOneQuery, [req.params.id]);
    //             if(!rows[0]) {
    //                 return res.status(404).send({'message': 'reflection not found'});
    //             }
    //             const values = [
    //                 req.body.success || rows[0].success,
    //                 req.body.low_point || rows[0].low_point,
    //                 req.body.take_away || rows[0].take_away,
    //                 moment(new Date()),
    //                 req.params.id
    //             ];
    //             const response = await db.query(updateOneQuery, values);
    //             return res.status(200).send(response.rows[0]);
    //         } catch(err) {
    //             return res.status(400).send(err);
    //         }
    //     })    
    // },
}
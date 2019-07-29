const db         = require('../db')
    , { Pool }   = require('pg')
    , pool       = new Pool();
const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'dlqcz2pyj',
    api_key: '634512344588652',
    api_secret: process.env.CLOUDINARY_SECRET
});
// require('locus');

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

            let updates = 0;
            // check for req.body.deletedImages.length 
            if(req.body.deleteImages && req.body.deleteImages.length) {
                // if - delete off CLOUDINARY using loop 
                
                for(const public_id of req.body.deleteImages) {
                    await cloudinary.v2.uploader.destroy(public_id);
                    // check for new photos  
                    if(req.files.length) {
                        // count loop iterations and splice file
                        updates++;
                        let file = req.files.splice(0,1);
                        // load photo file from cloudinary 
                        let newImage = await cloudinary.v2.uploader.upload(file[0].path);
                        let newImages = {
                            url: newImage.secure_url,
                            public_id: newImage.public_id
                        };
                        
                        // update the image that is being deleted 
                        let imageQuery = 'UPDATE image SET url = $1, public_id = $2 WHERE public_id = $3';
                        let params = [
                            newImages.url, 
                            newImages.public_id,
                            public_id
                        ];
                        await client.query(imageQuery, params);      
                    } else {
                        let sql = 'DELETE FROM image WHERE public_id = $1';
                        let params = [public_id];
                        await client.query(sql, params);                    
                    }
                }    
            }
            // when the req.files.length > req.body.deleteImages.length
            if(req.files.length || !req.files.length >= updates) {
                for(const file of req.files) {
                    // load photo file from cloudinary 
                    let newImage = await cloudinary.v2.uploader.upload(file.path);
                    let newImages = {
                        url: newImage.secure_url,
                        public_id: newImage.public_id
                    };
                    
                    // update the image that is being deleted 
                    let imageQuery = 'INSERT INTO image(url, public_id, post_id) VALUES($1, $2, $3)';
                    let params = [
                        newImages.url, 
                        newImages.public_id,
                        req.params.id
                    ];    
                    await client.query(imageQuery, params); 
                }
            }
            await client.query('COMMIT');    

            res.redirect(`/posts/${result.rows[0].id}`);
        } catch (err) {
            await client.query('ROLLBACK');
            next(err);
        } finally {
            client.release();
        }
    },
    // Posts Destroy
    async postDestroy(req, res, next) {
        // do image deletion prior to deletion of post so as to not violate foreign key constraint  
        // find out if there are images associated with post being deleted - hopefully not a query here 
        let findImageQuery = 'SELECT * FROM image WHERE post_id = $1';
        let params = [req.params.id];
        const { rows } = await db.query(findImageQuery, params);

        if(rows) {
            // loop and destroy images from cloudinary
            for(const image of rows) {
                await cloudinary.v2.uploader.destroy(image.public_id);
                // loop and DELETE from psql     
                let imageDeleteQuery = 'DELETE FROM image WHERE public_id = $1';
                let imgParam = [image.public_id];
                await db.query(imageDeleteQuery, imgParam);    
            } 
        }

        // post delete 
        let postDeleteQuery = "DELETE FROM post WHERE id = $1";
        await db.query(postDeleteQuery, params);
        return res.redirect('/posts')
    }
}
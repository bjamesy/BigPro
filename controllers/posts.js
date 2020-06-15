const db         = require('../db')
    , { Pool }   = require('pg')
    , pool       = new Pool();
const { cloudinary } = require('../cloudinary');
    // require('locus');

module.exports  = {
    // Posts Index
    async postIndex(req, res, next) {
        const count = await db.query('SELECT * FROM post');
        let pageNumber = req.params.pages;

        let postQuery ='SELECT * FROM post ORDER BY created_date DESC LIMIT (10) OFFSET ($1 - 1) * 10';
        let params = [pageNumber];
        const posts = await db.query(postQuery, params);

        let imgQuery = 'SELECT * FROM image';
        const images = await db.query(imgQuery);    

        return res.render('posts/index', { 
            // ++var returns the value+1 on that increment rather
            // than var++ that increases it after returning 
            pages: ++pageNumber,
            posts: posts.rows, 
            postCount: count.rows.length,
            images: images.rows,
            title: 'Posts Index'
        });
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

            let postQuery = 'INSERT INTO post(title, user_id, description, created_date, modified_date) VALUES($1, $2, $3, $4, $5) returning *';
            let params = [
                req.body.title,
                req.user.id,
                req.body.description,
                new Date(),
                new Date()
            ];
            const { rows } = await client.query(postQuery, params);

            for(const file of req.files) {
                let images = {
                    url: file.secure_url,
                    public_id: file.public_id
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
            
            req.session.success = 'Post created successfully!';
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
        let postQuery = 'SELECT * FROM post LEFT JOIN image ON image.post_id = post.id WHERE id = $1';
        let params = [req.params.id];

        let commentQuery = 'SELECT * FROM comment WHERE post_id = $1 ORDER BY created_date DESC';

        const { rows } = await db.query(postQuery, params);
        const results = await db.query(commentQuery, params);

        return res.render('posts/show', { 
            posts: rows, 
            comments: results.rows,
            title: 'Posts Show' 
        });
    },
    // Posts Edit
    async postEdit(req, res, next) {
        // we're passing the post {object} that was returned from the middleware check to the 
        // postEdit in the res.locals - so we dont have to query for post .. only images now

        let sql = 'SELECT * FROM image WHERE post_id = $1';
        let params = [req.params.id];

        const { rows } = await db.query(sql, params);

        return res.render('posts/edit', { 
            images: rows, 
            title: 'Posts Edit' 
        });
    },
    // Posts Update
    async postUpdate(req, res, next) {
        const { posts } = res.locals; // passed from middleware isAuthor

        let updateOneSQL = 'UPDATE post SET title = $2, description = $3, modified_date = $4 WHERE id = $1 returning *';
        let params = [
            posts.id, 
            req.body.title || posts.title, 
            req.body.description || posts.description, 
            new Date()
        ];
        await db.query(updateOneSQL , params);

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
                    // splice returns an array - hence the file[0]
                    let newImage = {
                        url: file[0].secure_url,
                        public_id: file[0].public_id
                    };
                    
                    // update the image that is being deleted 
                    let updateImage = 'UPDATE image SET url = $1, public_id = $2 WHERE public_id = $3';
                    let params = [
                        newImage.url, 
                        newImage.public_id,
                        public_id
                    ];
                    await db.query(updateImage, params);      
                } else {
                    let deleteImage = 'DELETE FROM image WHERE public_id = $1';
                    let params = [public_id];
                    await db.query(deleteImage, params);                    
                }
            }    
        }
        // when the req.files.length > req.body.deleteImages.length
        if(req.files.length || !req.files.length >= updates) {
            for(const file of req.files) {
                let newImage = {
                    url: file.secure_url,
                    public_id: file.public_id
                };
                
                // update the image that is being deleted 
                let insertImage = 'INSERT INTO image (url, public_id, post_id) VALUES($1, $2, $3)';
                let params = [
                    newImage.url, 
                    newImage.public_id,
                    req.params.id
                ];    
                await db.query(insertImage, params); 
            }
        }
        res.redirect(`/posts/${posts.id}`);
    },
    // Posts Destroy
    async postDestroy(req, res, next) {
        // do image deletion prior to deletion of post so as to not violate foreign key constraint
        const client = await pool.connect(); 
        try {
            await client.query('BEGIN');
            const { posts } = res.locals; // from isAuthor middleware
            let queryParams = [posts.id];

            // check for images associated with post
            let findImageQuery = 'SELECT * FROM image WHERE post_id = $1';
            const { rows } = await db.query(findImageQuery, queryParams);
            
            // delete comments associated with post
            let commentDelete = 'DELETE FROM comment WHERE post_id = $1';
            await db.query(commentDelete, queryParams);
    
            // check for not empty IMAGES result
            if(rows.length) {
                // delete images associated with post
                let imageDelete = 'DELETE FROM image WHERE post_id = $1';
                await db.query(imageDelete, queryParams);    
                // loop and destroy images from cloudinary
                for(const image of rows) {
                    await cloudinary.v2.uploader.destroy(image.public_id);
                }
            }
    
            // post delete 
            let postDelete = 'DELETE FROM post WHERE id = $1';
            await db.query(postDelete, queryParams);
            await client.query('COMMIT');

            req.session.success = 'Post deleted successfully';
            return res.redirect('/posts/pages/1');    
        } catch (err) {
            await client.query('ROLLBACK');
            next(err);
        } finally {
            client.release();
        }
    }
}
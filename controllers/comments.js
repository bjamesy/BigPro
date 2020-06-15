const db         = require('../db')
    , { Pool }   = require('pg')
    , pool       = new Pool();
// require('locus');

module.exports  = {
    // Comments Create
    async commentCreate(req, res, next) {
        let sql = 'INSERT INTO comment(post_id, description, user_id, created_date, modified_date) VALUES($1, $2, $3, $4, $5) returning *';
        let params = [
            req.params.id, 
            req.body.description, 
            req.user.id,
            new Date(),
            new Date()
        ];
        const { rows } = await db.query(sql, params);

        req.session.success = 'Comment created successfully';
        res.redirect(`/posts/${rows[0].post_id}`);
    },
    // Comments Update
    async commentUpdate(req, res, next) {
        let sql = 'UPDATE comment SET description = $1, modified_date = $2 WHERE id = $3 returning *';
        let params = [
            req.body.description || rows[0].description, 
            new Date(), 
            req.params.comment_id
        ];
        const { rows } = await db.query(sql, params);

        req.session.success = 'Comment updated successfully';
        res.redirect(`/posts/${rows[0].post_id}`);
    },
    // Comments Destroy
    async commentDestroy(req, res, next) {
        let sql = 'DELETE FROM comment WHERE id = $1';
        let params = [req.params.comment_id];
        await db.query(sql, params);

        req.session.success = 'Successfully delete comment'
        res.redirect('/posts/pages/1');
    }
}

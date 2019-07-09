const db = require('../db');

module.exports  = {
    create(req, res, next) {
        (async () => {
            const text = `INSERT INTO
                post(id, success, low_point, take_away, created_date, modified_date)
                VALUES($1, $2, $3, $4, $5, $6)
                returning *`;
            const values = [
                uuidv4(),
                req.body.success,
                req.body.low_point,
                req.body.take_away,
                moment(new Date()),
                moment(new Date())
            ];
        
            try {
                const { rows } = await db.query(text, values);
                return res.status(201).send(rows[0]);
            } catch (err) {
                return res.status(400).send(err);
            }
        })
    },
    getAll(req, res, next) {
        (async () => {
            const findAllQuery = 'SELECT * FROM post';
            try {
                const { rows, rowCount } = await db.query(findAllQuery);
                return res.status(200).send({ rows, rowCount });
            } catch(err) {
                return res.status(400).send(err);
            }
        })  
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
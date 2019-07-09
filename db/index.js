const { Pool } = require('pg');

const pool = new Pool();

// *** only when running single query should we use this *** - grabs first available
// client from pool and acquires/releases automatically .. therefore should not be
// used for transactions , since that would result in diff clients performing each q
module.exports = {
    query(sql, params) {
        return new Promise((resolve, reject) => {
            pool.query(sql, params)
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                })
        })
    }
}
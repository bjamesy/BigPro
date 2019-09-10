const faker = require('faker');
const db = require('./db');

async function seedPosts() {
    await db.query('DELETE FROM post');

    for(const i of new Array(40)) {
        const post = {
            title: faker.lorem.word(),
            description: faker.lorem.text(),
            author: '40'
        }
        let sql = 'INSERT INTO post(title, description, user_id, created_date, modified_date) VALUES($1, $2, $3, $4, $5)';
        let params = [
            post.title, 
            post.description, 
            post.author, 
            new Date(), 
            new Date()
        ];
        await db.query(sql, params)
    }
    console.log('40 new posts created');
};

module.exports = seedPosts;
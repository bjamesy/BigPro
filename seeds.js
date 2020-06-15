const faker = require('faker');
const db = require('./db');

async function seedPosts() {
    await db.query('DELETE FROM comment');
    await db.query('DELETE FROM image');
    await db.query('DELETE FROM post');

    for(const i of new Array(40)) {
        const post = {
            title: faker.lorem.word(),
            description: faker.lorem.text(),
            author: '40', 
            images: [
                {
                    url: 'https://res.cloudinary.com/dlqcz2pyj/image/upload/v1572305730/Beme/IMG_06106a03e6aa821824c020f291464c2cbd4f.png'
                }
            ]
        }
        let postSql = 'INSERT INTO post(title, description, user_id, created_date, modified_date) VALUES($1, $2, $3, $4, $5)';
        let postParams = [
            post.title, 
            post.description, 
            post.author, 
            new Date(), 
            new Date()
        ];
        await db.query(postSql, postParams);

        let imageSql = 'INSERT INTO image(url) VALUES($1)';
        let imageParams = [
            post.images.url
        ];
        await db.query(imageSql, imageParams);
    };
    console.log('40 new posts created');
};

module.exports = seedPosts;
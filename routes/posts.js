const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const { cloudinary, storage } = require('../cloudinary');
const upload = multer({ storage });
const { 
    asyncErrorHandler,
    isLoggedIn,
    isAuthor
} = require('../middleware');
const { 
    postIndex, 
    postNew, 
    postCreate,
    postShow,
    postEdit,
    postUpdate, 
    postDestroy
} = require('../controllers/posts');

/* GET posts index /posts */
router.get('/pages/:pages', asyncErrorHandler(postIndex))

/* GET posts new /posts/new */
router.get('/new', isLoggedIn, postNew);

/* POST posts create /posts */
router.post('/', isLoggedIn, upload.array('images', 4), postCreate);
  
/* GET posts show /posts/:id */
router.get('/:id', asyncErrorHandler(postShow));

/* GET posts edit /posts/:id/edit */
router.get('/:id/edit', isLoggedIn, asyncErrorHandler(isAuthor), asyncErrorHandler(postEdit));

/* PUT posts index /posts/:id */
router.put('/:id', isLoggedIn, asyncErrorHandler(isAuthor), upload.array('images', 4), postUpdate);
  
/* DELETE posts index /posts/:id */
router.delete('/:id', isLoggedIn, asyncErrorHandler(isAuthor), asyncErrorHandler(postDestroy));
  
module.exports = router;
const express = require('express');
const router = express.Router({ mergeParams: true });
const { 
    asyncErrorHandler, 
    isCommentAuthor,
    isLoggedIn 
} = require('../middleware');
const {
    commentCreate,
    commentUpdate,
    commentDestroy
} = require('../controllers/comments');

/* comment comments create /posts/:id/comments */
router.post('/', isLoggedIn, asyncErrorHandler(commentCreate));
  
/* PUT comments index /posts/:id/comments/:comment_id */
router.put('/:comment_id', isCommentAuthor, asyncErrorHandler(commentUpdate));
  
/* DELETE comments index /posts/:id/comments/:comment_id */
router.delete('/:comment_id', isCommentAuthor, asyncErrorHandler(commentDestroy));
  
module.exports = router;
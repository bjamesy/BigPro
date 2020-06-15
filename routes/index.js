const express = require('express');
const router = express.Router();
const { 
  getRegister,
  postRegister, 
  getLogin,
  postLogin, 
  getLogout,
  getProfile,
  putProfile,
  getForgotPw,
  putForgotPw,
  getReset, 
  putReset,
  getLanding
} = require('../controllers');
const { 
  asyncErrorHandler,  
  isLoggedIn, 
  isValidPassword,
  changePassword
} = require('../middleware');
 
/* GET home page. */
router.get('/', asyncErrorHandler(getLanding));

/* GET /register */
router.get('/register', getRegister);

/* POST /register */
router.post('/register', asyncErrorHandler(postRegister));

/* GET /login */
router.get('/login', getLogin);

/* POST /login */
router.post('/login', asyncErrorHandler(postLogin));

/* POST /logout */
router.get('/logout', getLogout);

/* GET /profile */
router.get('/profile', isLoggedIn, asyncErrorHandler(getProfile));

/* PUT /profile/:user_id */
router.put('/profile', 
  isLoggedIn, 
  asyncErrorHandler(isValidPassword), 
  asyncErrorHandler(changePassword), 
  asyncErrorHandler(putProfile)
);

/* GET /forgot */
router.get('/forgot-password', getForgotPw);

/* PUT /forgot */
router.put('/forgot-password', asyncErrorHandler(putForgotPw));

/* PUT /reset/:token */
router.get('/reset/:token', asyncErrorHandler(getReset));

/* PUT /reset/:token */
router.put('/reset/:token', asyncErrorHandler(putReset));

module.exports = router;
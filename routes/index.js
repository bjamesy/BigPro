const express = require('express');
const LocalStrategy = require('passport-local').Strategy;
const router = express.Router();
const { postRegister } = require('../controllers/index');
const { Pool, Client} = require('pg');

/* GET home page. */
router.get('/', (req, res, next) => {
  // const pool = new Pool();

  // pool.connect()
  //   .then(() => {
  //     console.log('looks like u connected to POSTGRES');
  //     res.render('index', { title: 'Beme' });
  //   })
  //   .catch(err => {
  //     console.log('ERROR: ', err);
  //   })
});

/* GET /register */
router.get('/register', (req, res, next) => {
  res.send('POST /register');
});

/* POST /register */
router.post('/register', postRegister);

/* GET /login */
router.get('/login', (req, res, next) => {
  res.send('GET /login');
});

/* POST /login */
router.post('/login', (req, res, next) => {
  res.send('POST /login');
});

/* GET /profile */
router.post('/profile', (req, res, next) => {
  res.send('GET /profile/:user_id');
});

/* PUT /profile/:user_id */
router.put('/profile/:user_id', (req, res, next) => {
  res.send('PUT /profile/:user_id');
});

/* GET /forgot */
router.get('/forgot', (req, res, next) => {
  res.send('GET /forgot');
});

/* PUT /forgot */
router.put('/forgot', (req, res, next) => {
  res.send('PUT /forgot');
});

/* PUT /reset/:token */
router.get('/reset/:token', (req, res, next) => {
  res.send('GET /reset/:token');
});

/* PUT /reset/:token */
router.put('/reset/:token', (req, res, next) => {
  res.send('PUT /reset/:token');
});

module.exports = router;
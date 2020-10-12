const express = require('express');
const expressLayouts = require('express-ejs-layouts');


const flash = require('connect-flash');
const session = require('express-session');
const mysql = require('mysql');
const bodyparser = require("body-parser");
const fileupload = require('express-fileupload');
const busboy = require("then-busboy");
const http = require('http');
const path = require('path');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'DeliverMe',
  port:'8889'
})

db.connect((err) => {
  if (err) console.log(err);
  else {
    console.log("Connected to Mysql database");
  }
});

const app = express();



//ejs
app.use(expressLayouts);
app.set('view engine', 'ejs');


//bodyparser
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(express.static(path.join(__dirname, 'public')));

//fileupload
app.use(fileupload());


//session
app.use(session({
  secret: 'thisismysecretdonttellthisanyone',
  name: 'sid',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 10000 * 6 * 20,
    sameSite: true,
    secure: false
  }

}));


app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');

  res.locals.error_msg = req.flash('error_msg');

  res.locals.error = req.flash('error');
  next();
})

app.use('/', require('./routes/index'));
app.use('/users', require('./routes/user'));



const PORT = 3000;

app.listen(PORT, console.log("listening on port "));
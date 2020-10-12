const express = require('express');

const router = express.Router();
const bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');

const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public');
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const upload = multer({ storage: storage, fileFilter: fileFilter });
const busboy = require('express-busboy');


router.use(bodyParser.urlencoded({ extended: false }));




const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: "DeliverMe",
    port:'8889'
});
const { redirectLogin } = require('../config/auth');
const { redirectHome } = require('../config/auth');


router.get('/login', redirectHome, (req, res) => res.render('login'));


router.get('/register', redirectHome, (req, res) => res.render('register'));

router.post('/register', (req, res) => {
    const { name, email, phone, password, password2 } = req.body;
    let errors = []




    if (phone.length !== 10) {
        errors.push({ msg: 'Enter your 10 digit-phone number ' })
    }
    if (password !== password2) {
        errors.push({ msg: 'passwords dont match ' });
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            phone,
            password,
            password2
        })
    }
    else {



        const { name, email, phone, password, password2 } = req.body;
        console.log("fsd" + phone);
        var q1 = 'select mobile_no from users where mobile_no= ?';
        db.query(q1, [phone], async (err, results) => {
            if (err) console.log(err);

            if (results.length > 0) {
                errors.push({ msg: 'This number is already registered ' })
                return res.render('register', {
                    errors,
                    name,
                    email,
                    phone,
                    password,
                    password2
                })
            }



            let hashedpassword = await bcrypt.hash(password, 8);


            var q2 = 'insert into users set ?'
            db.query(q2, { user_name: name, email: email, mobile_no: phone, password: hashedpassword }, (err, results) => {
                if (err) {
                    console.log(err);

                }
                else {
                    console.log(req.body);
                    console.log('registered');
                    return res.redirect('/users/login')
                }
            })


        })




    }


})
router.post('/login', (req, res, next) => {
    try {
        let errors = []

        const phone = req.body.phone;
        const password = req.body.password;
        const choice = req.body.choice;


        db.query('Select * from users where mobile_no = ?', [phone], async (err, results) => {
            if (!results[0]) {
                console.log('no results');
                errors.push({ msg: 'mobile number or password incorrect' })
                return res.status(401).render('login', { errors, phone });
            }
            else {
                if (!(await bcrypt.compare(password, results[0].password))) {
                    errors.push({ msg: 'mobile number or password incorrect' })
                    return res.status(401).render('login', { errors, phone });
                }
                else {
                    req.session.userdetails = results[0]; 
                    
                    if(choice == 'choice1')
                    {
                        req.session.usertype = 'helper';
                        res.redirect('/dashboard1');
                    }
                    else if(choice == 'choice2')
                    {
                        req.session.usertype = 'help_seeker';
                        res.redirect('/dashboard2');
                    }
                    else{
                            console.log('error');
                    }
               
                }

            }

        })
    } catch (error) {
        console.log('error');
    }
})

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard')
        }
        else {
            res.clearCookie('sid');
            return res.redirect('/users/login');
        }




    })


})

router.get('/request_buy', (req, res) => {
    let user = req.session.userdetails;
    res.render('request_buy', { user })
})

router.post('/request_buy', redirectLogin, (req, res) => {

    let user = req.session.userdetails;
    const { pname, pprice, pdesc, pimage, rprice, lat1, lng1, lat2, lng2 } = req.body;
    var query = "insert into buy_request set ?";
    db.query(query, { buyer: user.id, pname: pname, pprice: pprice, pdesc, rprice, lat1, lng1, lat2, lng2 }, (err, results) => {
        if (err)
            console.log(err);
        else {
            res.send("data inserted");
        }
    });
})



router.get('/helper', (req, res) => {
    let user = req.session.userdetails;
    res.render('helper', { user })
})

router.post('/helper', redirectLogin, (req, res) => {

    let user = req.session.userdetails;
    console.log(user.phone);

    const {  lat1, lng1, lat2, lng2 } = req.body;
    var query = "insert into helper_details set ?";
    db.query(query, { user_name: user.user_name, phone : user.mobile_no , lat1, lng1, lat2, lng2, id: user.id}, (err, results) => {
        if (err)
            console.log(err);
        else {
            res.send("data inserted");
        }
    });
})


module.exports = router;

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const router = express.Router();
const mysql = require('mysql');
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const passport = require("passport");
const session = require('express-session');
const flash = require('connect-flash');
require('./passport')(passport);


// Express-Session - for messages
app.use(session({
    secret: 'hemlighet',
    resave: true,
    saveUninitialized: true
}));


//passport
app.use(passport.initialize());
app.use(passport.session());

//Connect-Flash 
app.use(flash());

//Globals
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

// Body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    port: "10003",
    database: "restaurantschema"
});


con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

app.post('/register', async (req, res, err) => {
    let errors = [];
    const { username, password, password2 } = req.body

    //check all inputs
    if (!username || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }
    //check if PWs match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' })
    }
    if (await userExists(username)) {
        errors.push({ msg: 'Username already exists' })
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            username,
            password,
            password2
        })
    }
    //PASSED VALIDATION 
    else {
        bcrypt.hash(req.body.password, 10, function (err, hash) {
            //Hashing Passwords
            req.body.password = hash;
            req.body.password2 = hash;
            const user = { username: req.body.username, password: req.body.password };
            module.exports.user = user
            req.flash('success_msg', 'Account was succesfully created!');
            res.redirect("login");
            let sql = "INSERT INTO user(Username,Password,Password2) VALUES('" + req.body.username + "','" + req.body.password + "','" + req.body.password2 + "')"
            con.query(sql, function (err) {
            });
        });
    }
});


const userExists = (username) => {
    return new Promise((resolve) => {
        con.query(
            'SELECT userid FROM user WHERE username = ? LIMIT 1',
            [username],
            (error, result) => {
                if (error) return reject(error);

                if (result && result[0]) {
                    console.log('User exists:', result); // for debug purposes
                    return resolve(true);
                }

                resolve(false);
            });
    });
};


function ensureAuthenticated(req, res, next) {
    let errors = []
    if (req.isAuthenticated())
        return next();
    else
        errors.push({ msg: 'You are not authorised, please log in!' })
    console.log(errors)
    res.render('login', {
        errors
    })
}

//routes
router.get('/feed', ensureAuthenticated, function (req, res) {
    con.query("SELECT * FROM restaurant", function (err, result) {
        if (err) throw err;
        con.query("SELECT * FROM review", function (err, reviews) {
            if (err) throw err;
            res.render("feed", {
                restaurants: result,
                reviews: JSON.parse(JSON.stringify(reviews))
            });
        });
    });
});

router.get('/reviews/:id', function (req, res) {
    let id = req.params.id;
    con.query("SELECT * FROM review Inner Join user on review.UserId=user.UserId WHERE restaurantId=" + req.params.id, function (err, reviews) {
        console.log(reviews)
    //con.query("SELECT * FROM review WHERE restaurantId=" + req.params.id, function (err, reviews) {
        if (err) throw err;
        res.render("reviews", {
            id,
            reviews
            });
        } 
    );
});

router.get('/review/edit/:id', function (req, res) {
    let id = req.params.id;
    const { imgUrl, name, location, priceClass, restaurantCategoryId, categories } = req.body;
    console.log('BODY', req.body)
    if (id && id === '0') {
        con.query(`INSERT INTO restaurant (Name,Location,PriceClass, RestaurantCategoryId, Categories, ImgUrl) VALUES ('${name}', '${location}', ${priceClass},  ${0},'${categories}', '${imgUrl}')`,
            function (err, result) {
                if (err) throw err;
                res.redirect("/feed");
            });
    }
    else {
        console.log("req body" + req.body)
        con.query(`UPDATE restaurant SET Name='${name}',Location='${location}',PriceClass=${priceClass}, RestaurantCategoryId=${0}, Categories='${categories}',ImgUrl='${imgUrl}'  WHERE RestaurantId = ${id}`, function (err, result) {
            console.log(err)
            if (err) throw err;
            res.redirect("/feed");
        });
    }

});

router.get('/login', (req, res) => {
    res.render("login");
});

router.get('/', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});
app.get('/restaurant/:id', (req, res) => {
    let id = req.params.id;
    if (id && id === '0') {
        res.render("restaurant", { restaurant: null });
    }
    else {
        con.query("SELECT * FROM restaurant  WHERE restaurantId =" + id, function (err, result) {
            if (err) throw err;
            console.log(result[0])
            res.render("restaurant", { restaurant: result[0] });
        });
    }
});

//get create review
router.get('/createReview/:id', (req, res) => {
    let id = req.params.id;
    if (isNaN(id) || parseInt(id) < 1) {
        res.render('feed')
    }
    else {
        con.query("SELECT * FROM restaurant WHERE restaurantId =" + id, function (err, result) {
            if (err) throw err;
            res.render("createReview", { id });
        });
    }
});
// create review
app.post('/createReview/:id', (req, res) => {
    console.log(req.body);
    console.log(req.params.id);
    console.log(req.user.UserId);
    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    con.query(`INSERT INTO review (RestaurantId, UserId, Body, PublishDate, Rating) VALUES ('${req.params.id}', '${req.user.UserId}', '${req.body.reviewText}', '${year + "-" + month + "-" + date}', '${req.body.reviewStars}')`,
    function (err, result) {
        if (err) throw err;
        res.redirect("/feed");
    });
});

// get delete
app.get('/restaurant/delete/:id', (req, res) => {
    let id = req.params.id;
    console.log("Delete")
    con.query(`DELETE FROM restaurant WHERE RestaurantId = ${id}`, function (err, result) {
        console.log(err)
        if (err) throw err;
        res.redirect("/feed");
    });

});

// edit
app.post('/restaurant/edit/:id', (req, res) => {
    let id = req.params.id;
    const { imgUrl, name, location, priceClass, restaurantCategoryId, categories } = req.body;
    console.log('BODY', req.body)
    if (id && id === '0') {
        con.query(`INSERT INTO restaurant (Name,Location,PriceClass, RestaurantCategoryId, Categories, ImgUrl) VALUES ('${name}', '${location}', ${priceClass},  ${0},'${categories}', '${imgUrl}')`,
            function (err, result) {
                if (err) throw err;
                res.redirect("/feed");
            });
    }
    else {
        console.log("console.log body" + req.body)
        con.query(`UPDATE restaurant SET Name='${name}',Location='${location}',PriceClass=${priceClass}, RestaurantCategoryId=${0}, Categories='${categories}',ImgUrl='${imgUrl}'  WHERE RestaurantId = ${id}`, function (err, result) {
            console.log(err)
            if (err) throw err;
            res.redirect("/feed");
        });
    }
});

// login 
app.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/feed',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

// Logout
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('login');
  });

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    next();
  })



app.use('/public', express.static('public'));
app.use(express.static(__dirname + '/Script'));


app.use('/', router);
app.listen(port, () => console.log(`listening on port ${port}!`))



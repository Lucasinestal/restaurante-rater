const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mysql = require('mysql');


var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    port: "10003",
    database: "restaurantschema"
});


module.exports = function (passport) {
    // Local Strategy login
    passport.use(new LocalStrategy(function (username, password, done) {

        // Match Username
        let sql = 'SELECT * FROM user WHERE username = ? LIMIT 1';
        con.query(sql, [username], function (err, result) {
            if (err)
                return err;
            if (!result) {
                return done(null, false, { message: 'Wrong user' });
            }
            //  Match Password
            bcrypt.compare(password, result[0].Password).then(function (res) {
                if (res) {
                    return done(null, result[0]);
                } else {
                    return done(null, false, { message: 'Wrong pass' });
                }
            });
        })
    }
    ));
    passport.serializeUser(function (user, done) {
        //console.log(user)
        //console.log(user.UserId)
        done(null, user.UserId);
    });

    passport.deserializeUser(function (id, done) {
        con.query(`SELECT * FROM user WHERE UserId = ${id};`, (err, result) => {
            console.log(err, result)
            done(null, result[0]);
        })
    });
};
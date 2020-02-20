
function getAll(table, id = null) {
    let queryExtension = '';
    if (id) queryExtension = `WHERE id = ${id}`;
    con.connect(function (err) {
        if (err) throw err;
        con.query(`SELECT * FROM ${table} ${queryExtension}`, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
        });
    });
}
function get(column, table, id) {
    con.connect(function (err) {
        if (err) throw err;
        con.query(`SELECT FIRS(${column} FROM ${table} WHERE id = ${id}`, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
        });
    });
}

function create(table, dto) {
    let names = '';
    let value = '';
    for (const key in dto) {
        if (object.hasOwnProperty(key)) {
            names += `${key},`;
            value += `${object[key]},`
        }
    }
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `INSERT INTO ${table} (${value}) VALUES (${names})`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    });
}

function update(table, dto, id) {
    let request = '';
    for (const key in dto) {
        if (object.hasOwnProperty(key)) {
            value += `${key}=${object[key]},`
        }
    }
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `UPDATE ${table} SET ${request} WHERE id=${id}`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    });
}

function remove(table, id) {
    con.connect(function (err) {
        if (err) throw err;
        var sql = `DELETE FROM ${table} WHERE id = ${id}`;
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Number of records deleted: " + result.affectedRows);
        });
    });
}
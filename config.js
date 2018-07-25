// custom your MySQL config here
var dbConfig = {
    database: 'ra_website',
    username: 'root',
    password: 'admin@0225',
    host: 'localhost',
    port: 3306
};

// custom your admin username and password here
var adminConfig = {
    username: 'admin',
    password: 'admin'
}

exports.dbConfig = dbConfig;
exports.adminConfig = adminConfig;
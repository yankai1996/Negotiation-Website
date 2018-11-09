// custom your MySQL config here
var dbConfig = {
    database: 'ra_website_v1', // please create a new MySQL database
    username: 'root',
    password: 'admin@0225',
    host: 'localhost',
    port: 3306,
    init: false // set true for creating tables in the database
};

// custom your admin username and password here
var adminConfig = {
    username: 'admin',
    password: 'admin'
};

// custom your port number here
var serverConfig = {
    port: 8888
}

exports.dbConfig = dbConfig;
exports.adminConfig = adminConfig;
exports.serverConfig = serverConfig;
// your MySQL configuration
const dbConfig = {
    database: 'ra_website_v1', // please create a new MySQL database
    username: 'root',
    password: 'admin@0225',
    host: 'localhost',
    port: 3306,
    init: false // set true for creating tables in the database
};

// your admin username and password
const adminConfig = {
    username: 'admin',
    password: 'admin'
};

// your server port number
const serverConfig = {
    port: 8888
}

// the experiment parameters
const defaultParams = {
    alpha: 0.3,
    beta: 0.6,
    gamma: 0.2,
    t: 10,
    w: 17
}

// the base payment
const basePayment = 40;

exports.dbConfig = dbConfig;
exports.adminConfig = adminConfig;
exports.serverConfig = serverConfig;
exports.defaultParams = defaultParams;
exports.basePayment = basePayment;
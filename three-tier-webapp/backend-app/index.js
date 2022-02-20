// CONSOLE DEBUGGING mysql -h three-tiered-web-app-database.cv6lqy3quqpr.eu-central-1.rds.amazonaws.com -P 3306 --user=syscdk --password=cbXho4oemQz9qZRLXf7BtJpt7Gf0YUYD

var express = require("express");
var mysql = require('mysql')

var { fork } = require('child_process');

var bodyParser = require('body-parser');

// Load the AWS SDK
var AWS = require('aws-sdk'),
    region = "eu-central-1",
    secretName = "rds-credentials",
    decodedBinarySecret;

// Create a Secrets Manager client
var secretsManager = new AWS.SecretsManager({
    region: region
});

var app = express();

app.use(bodyParser.json());

// CORS header
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});


app.get("/createtables", (req, res, next) => {
    getCredentialsAsync().then(data => {
        
        var host, username, password;
        
        if (data.SecretString) {
            const secretObj = JSON.parse(data.SecretString)
            password = secretObj.password;
            username = secretObj.username;
            host = secretObj.host;
        } else {
            let buff = new Buffer(data.SecretBinary, 'base64');
            decodedBinarySecret = buff.toString('ascii');
        }
        
        var connection = openRDSConnection(host, username, password);
        
        var anyError = false;
        
        var createDatabase = new Promise(function(resolve, reject) {
            connection.query("CREATE DATABASE shop;", function (err, rows, fields) {
                if (err) {
                    anyError = true;
                    res.json({status: 'FAILED', message: err.code});
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
        
        createDatabase.then(() => {
            
            var createProductsTable = new Promise(function(resolve, reject) {
                connection.query("CREATE TABLE shop.products (ProductID int, Name varchar(255), Description varchar(255), Price int);", function (err, rows, fields) {
                    if (err) {
                        anyError = true;
                        res.json({status: 'FAILED', message: err.code});
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            
            createProductsTable.then(() => {
                connection.query("INSERT INTO shop.products VALUES (0, 'T-Shirt No. 1', 'Green T-shirt with great fabric.', 12);", function (err, rows, fields) {
                    if (err) {
                        anyError = true;
                        res.json({status: 'FAILED', message: err.code});
                    }
                });
            })
            .then(() => {
                connection.query("INSERT INTO shop.products VALUES (1, 'T-Shirt No. 2', 'Blue T-shirt with great fabric.', 14);", function (err, rows, fields) {
                    if (err) {
                        anyError = true;
                        res.json({status: 'FAILED', message: err.code});
                    }
                });
            })
            .then(() => {
                connection.query("INSERT INTO shop.products VALUES (2, 'T-Shirt No. 3', 'Red T-shirt with great fabric.', 10);", function (err, rows, fields) {
                    if (err) {
                        anyError = true;
                        res.json({status: 'FAILED', message: err.code});
                    }
                });
            });
            
            
            var createUserTable =  new Promise(function(resolve, reject) {
                connection.query("CREATE TABLE shop.user (UserID int, Name varchar(255), CartID int);", function (err, rows, fields) {
                    if (err) {
                        anyError = true;
                        res.json({status: 'FAILED', message: err.code});
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            })
            
            createUserTable.then(() => {
                connection.query("INSERT INTO shop.user VALUES (1, 'Adrian Lohr', 1);", function (err, rows, fields) {
                    if (err) {
                        anyError = true;
                        res.json({status: 'FAILED', message: err.code});
                    }
                });
            });
            
            
            var createCartsTable =  new Promise(function(resolve, reject) {
                connection.query("CREATE TABLE shop.carts (CardID int, UserID int, ProductID int);", function (err, rows, fields) {
                    if (err) {
                        anyError = true;
                        res.json({status: 'FAILED', message: err.code});
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            
            
            Promise.all([createDatabase, createProductsTable, createUserTable, createCartsTable]).then(() => {
                if (!anyError) {
                    console.log("We've got no errors.")
                    res.json({status: 'OK'});
            	} else {
            	    console.log("We've got an error!")
            	}
            	
            	connection.end();
            });
        });
    });
});

app.get("/", (req, res, next) => {
  res.json({status: 'OK'});
})

app.get("/products", (req, res, next) => {
    getCredentialsAsync().then(data => {
        
        var host, username, password;
        
        if (data.SecretString) {
            const secretObj = JSON.parse(data.SecretString)
            password = secretObj.password;
            username = secretObj.username;
            host = secretObj.host;
        } else {
            let buff = new Buffer(data.SecretBinary, 'base64');
            decodedBinarySecret = buff.toString('ascii');
        }
        
        var connection = openRDSConnection(host, username, password);

        connection.query('SELECT * FROM shop.products', function (err, rows, fields) {
            if (err) {
                res.json({status: 'FAILED', message: err.code});
            } else {
                res.send(rows);
            }
            
            connection.end();
        });
    });
});

app.get("/carts", (req, res, next) => {
    getCredentialsAsync().then(data => {
        
        var host, username, password;
        
        if (data.SecretString) {
            const secretObj = JSON.parse(data.SecretString)
            password = secretObj.password;
            username = secretObj.username;
            host = secretObj.host;
        } else {
            let buff = new Buffer(data.SecretBinary, 'base64');
            decodedBinarySecret = buff.toString('ascii');
        }
        
        var connection = openRDSConnection(host, username, password);

        connection.query('SELECT * FROM shop.carts', function (err, rows, fields) {
            if (err) {
                res.json({status: 'FAILED', message: err.code});
            } else {
                res.send(rows);
            }
            
            connection.end();
        });
    });
});

app.post("/carts",(req, res) => {
    var cartId = req.body.cartId;
    var userId = req.body.userId;
    var productId = req.body.productId;
    
    getCredentialsAsync().then(data => {
        
        var host, username, password;
        
        if (data.SecretString) {
            const secretObj = JSON.parse(data.SecretString)
            password = secretObj.password;
            username = secretObj.username;
            host = secretObj.host;
        } else {
            let buff = new Buffer(data.SecretBinary, 'base64');
            decodedBinarySecret = buff.toString('ascii');
        }
        
        var connection = openRDSConnection(host, username, password);
        
        connection.query("INSERT INTO shop.carts VALUES ( ?, ?, ? )", [cartId, userId, productId], function (err, rows, fields) {
            if (err) {
                res.json({status: 'FAILED', message: err.message});
            } else {
                res.send(rows);
            }
            
            connection.end();
        });
    
    });
});

app.post("/stress",(req, res) => {
    var stressSec = req.body.stressSec;
    const child = fork(__dirname + '/loadtest');
    child.on('message', (message) => {
      console.log('Returning from child process');
      res.json({status: 'OK'});
    });

    child.send('START');
});

app.get("/stress",(req, res) => {
    var i = 0;
    var result = 0;
    while(i <= 10000) {
    	result += Math.random() * Math.random();
    	console.log(result)
    	i++;
    }
    
    res.json({status: 'OK'});
});

app.listen(8080, () => {
    console.log("Server running on port 8080");
});

function getSecretPromise() {
    return secretsManager.getSecretValue({ SecretId: secretName }).promise();
}

// Returns a promise
async function getCredentialsAsync() {
    var error;
    var data = await getSecretPromise().catch(err => (error = err));
    if (error) {
        console.log('Error retrieving secrets');
        console.error(error);
    }
    return data;
}

function openRDSConnection(host, username, password) {
    var connection = mysql.createConnection({
        host: host,
        user: username,
        password: password
    });
    
    connection.connect();
    
    return connection;
}

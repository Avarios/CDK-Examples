
const got = require('got');
const responseHeader = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
};

exports.handler = async (event, context, callback) => {
    try {
        let eventBody = JSON.parse(event.body);
        let IP = undefined;
        if (eventBody.type === 'server') {
            IP = process.env.appIP;
        }
        if (eventBody.type === 'database') {
            IP = process.env.databaseIP;
        }
        if (!IP) {
            callback({ error: 'No server type defined' }, null);
        }
        await got.get(`http://${IP}`);
        const response = {
            "statusCode": 200,
            "body": JSON.stringify({ result: false }),
            "headers": responseHeader
        };
        callback(null, response);
    }
    // I asume, when the server is not responding, the server is in shutdown state
    catch (error) {
        const response = {
            "statusCode": 200,
            "body": JSON.stringify({ result: true }),
            "headers": responseHeader
        };
        callback(null, response);
    }
}
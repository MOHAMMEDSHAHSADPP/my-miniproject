const http = require('http');

function check(url) {
    console.log(`Checking ${url}...`);
    const req = http.get(url, (res) => {
        console.log(`URL: ${url}`);
        console.log('Status:', res.statusCode);
        if (res.statusCode !== 200) {
            console.log('Headers:', res.headers);
        }
        res.resume();
    });

    req.on('error', (e) => {
        console.error(`Error fetching ${url}:`, e.code, e.message);
    });
}

check('http://localhost:8081/ping');
check('http://localhost:8081/uploads/visitor/1770487595569.jpg');

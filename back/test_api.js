const http = require('http');

function check(url) {
    console.log(`Checking ${url}...`);
    http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            try {
                const json = JSON.parse(data);
                console.log('Keys:', Object.keys(json));
                if (json.trending) console.log('Trending count:', json.trending.length);
                if (json.announcements) console.log('Announcements count:', json.announcements.length);
                if (json.emergency) console.log('Emergency count:', json.emergency.length);
                if (json.popularPlaces) console.log('Popular Places count:', json.popularPlaces.length);
                if (json.recentPlaces) console.log('Recent Places count:', json.recentPlaces.length);
            } catch (e) {
                console.error('Invalid JSON', e.message);
            }
        });
    }).on('error', (e) => {
        console.error(`Error fetching ${url}:`, e.message);
    });
}

check('http://localhost:8081/visitor/kuttippuram/home');

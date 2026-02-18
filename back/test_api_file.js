const http = require('http');
const fs = require('fs');

function check(url) {
    console.log(`Checking ${url}...`);
    http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            try {
                const json = JSON.parse(data);
                const keys = Object.keys(json);
                let output = `Status: ${res.statusCode}\nKeys: ${keys.join(', ')}\n`;
                if (json.trending) output += `Trending count: ${json.trending.length}\n`;
                if (json.announcements) output += `Announcements count: ${json.announcements.length}\n`;
                if (json.emergency) output += `Emergency count: ${json.emergency.length}\n`;
                if (json.popularPlaces) output += `Popular Places count: ${json.popularPlaces.length}\n`;
                if (json.recentPlaces) output += `Recent Places count: ${json.recentPlaces.length}\n`;

                fs.writeFileSync('api_response.txt', output);
                console.log('Output written to api_response.txt');
            } catch (e) {
                console.error('Invalid JSON', e.message);
            }
        });
    }).on('error', (e) => {
        console.error(`Error fetching ${url}:`, e.message);
    });
}

check('http://localhost:8081/visitor/kuttippuram/home');

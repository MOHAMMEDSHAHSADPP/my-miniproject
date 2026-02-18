const fetch = require("node-fetch");
const osmtogeojson = require("osmtogeojson");

const centerLat = 10.8505;
const centerLon = 76.0357;
const radiusKm = 2;

const R = 6371;
const latDelta = (radiusKm / R) * (180 / Math.PI);
const lonDelta = (radiusKm / (R * Math.cos(centerLat * Math.PI / 180))) * (180 / Math.PI);

const bbox = {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLon: centerLon - lonDelta,
    maxLon: centerLon + lonDelta
};

const bboxString = `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`;

// SIMPLIFIED QUERY - buildings only
const query = `
[out:json][timeout:60];
(
  way["building"](${bboxString});
  relation["building"](${bboxString});
);
out body;
>;
out skel qt;
`;

console.log("Testing SIMPLIFIED OSM query (buildings only)");
console.log("Bbox:", bboxString);

async function test() {
    try {
        console.log("\nFetching from Overpass API...");
        const start = Date.now();

        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "MiniiiTownMap/1.0"
            }
        });

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`Response: ${response.status} ${response.statusText} (${elapsed}s)`);

        if (!response.ok) {
            const text = await response.text();
            console.error("Error:", text.substring(0, 300));
            return;
        }

        const data = await response.json();
        console.log("✅ Elements received:", data.elements?.length || 0);

        const geojson = osmtogeojson(data);
        console.log("✅ GeoJSON features:", geojson.features?.length || 0);

        console.log("\n🎉 SUCCESS!");
    } catch (e) {
        console.error("\n❌ ERROR:", e.message);
    }
}

test();

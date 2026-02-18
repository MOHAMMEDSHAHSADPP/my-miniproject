const fetch = require("node-fetch");
const osmtogeojson = require("osmtogeojson");

// Test coordinates for Kuttippuram
const centerLat = 10.8505;
const centerLon = 76.0357;
const radiusKm = 2;

// Calculate bbox (same logic as Town.js)
const R = 6371; // Earth radius in km
const latDelta = (radiusKm / R) * (180 / Math.PI);
const lonDelta = (radiusKm / (R * Math.cos(centerLat * Math.PI / 180))) * (180 / Math.PI);

const bbox = {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLon: centerLon - lonDelta,
    maxLon: centerLon + lonDelta
};

const bboxString = `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`;

console.log("Testing OSM fetch for Kuttippuram");
console.log("Center:", centerLat, centerLon);
console.log("Bbox:", bboxString);
console.log("");

const query = `
[out:json][timeout:25];
(
  way["building"](${bboxString});
  relation["building"](${bboxString});
);
out body;
>;
out skel qt;
`;

console.log("Query:", query);
console.log("");

async function test() {
    try {
        console.log("Fetching from Overpass API...");
        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "MiniiiTownMap/1.0"
            }
        });

        console.log("Response status:", response.status, response.statusText);

        if (!response.ok) {
            const text = await response.text();
            console.error("Error response:", text.substring(0, 500));
            throw new Error(`Overpass API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Elements received:", data.elements?.length || 0);

        if (data.elements && data.elements.length > 0) {
            console.log("Sample element:", JSON.stringify(data.elements[0], null, 2));
        }

        const geojson = osmtogeojson(data);
        console.log("GeoJSON features:", geojson.features?.length || 0);

        console.log("\n✅ SUCCESS! OSM data fetched successfully.");
    } catch (e) {
        console.error("\n❌ ERROR:", e.message);
        console.error("Stack:", e.stack);
    }
}

test();

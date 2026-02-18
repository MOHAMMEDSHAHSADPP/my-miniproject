// Utility functions for OpenStreetMap integration

/**
 * Geocode a place name to get bounding box using Nominatim
 * @param {string} placeName - e.g., "Kuttippuram, Malappuram, Kerala, India"
 * @returns {Promise<{lat: number, lng: number, bbox: [number, number, number, number]}>}
 */
export async function geocodePlace(placeName) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'TownManagementApp/1.0'
        }
    });

    if (!response.ok) {
        throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
        throw new Error('Place not found');
    }

    const result = data[0];
    return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        bbox: result.boundingbox.map(parseFloat) // [minLat, maxLat, minLng, maxLng]
    };
}

/**
 * Create a bounding box around a center point with given radius
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {string} Overpass bbox string "minLat,minLng,maxLat,maxLng"
 */
export function createBoundingBox(lat, lng, radiusKm = 2) {
    // Rough conversion: 1 degree latitude ≈ 111 km
    const latDelta = radiusKm / 111;
    // Longitude varies by latitude: 1 degree ≈ 111 * cos(lat) km
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    return `${lat - latDelta},${lng - lngDelta},${lat + latDelta},${lng + lngDelta}`;
}

/**
 * Fetch buildings from OpenStreetMap using Overpass API
 * @param {string} bbox - Bounding box string "minLat,minLng,maxLat,maxLng"
 * @returns {Promise<Object>} Overpass JSON response
 */
export async function fetchOSMBuildings(bbox) {
    const query = `
    [out:json][timeout:25];
    (
      way["building"](${bbox});
      relation["building"](${bbox});
    );
    out body;
    >;
    out skel qt;
  `;

    const url = 'https://overpass-api.de/api/interpreter';

    const response = await fetch(url, {
        method: 'POST',
        body: query,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (!response.ok) {
        throw new Error('Overpass API request failed');
    }

    return await response.json();
}

/**
 * Convert WGS84 coordinates to local meters for Three.js
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} centerLat - Center latitude (origin)
 * @param {number} centerLng - Center longitude (origin)
 * @returns {{x: number, z: number}} Local coordinates in meters
 */
export function latLngToMeters(lat, lng, centerLat, centerLng) {
    const R = 6371000; // Earth radius in meters

    // Convert to radians
    const lat1 = centerLat * Math.PI / 180;
    const lat2 = lat * Math.PI / 180;
    const deltaLat = (lat - centerLat) * Math.PI / 180;
    const deltaLng = (lng - centerLng) * Math.PI / 180;

    // Haversine formula for accurate distance
    const x = deltaLng * Math.cos((lat1 + lat2) / 2) * R;
    const z = -deltaLat * R; // Negative because Three.js Z is inverted

    return { x, z };
}

/**
 * Calculate centroid of a polygon
 * @param {Array<{lat: number, lng: number}>} coords - Array of coordinates
 * @returns {{lat: number, lng: number}}
 */
export function calculateCentroid(coords) {
    if (!coords || coords.length === 0) {
        return { lat: 0, lng: 0 };
    }

    const sum = coords.reduce((acc, coord) => ({
        lat: acc.lat + coord.lat,
        lng: acc.lng + coord.lng
    }), { lat: 0, lng: 0 });

    return {
        lat: sum.lat / coords.length,
        lng: sum.lng / coords.length
    };
}

/**
 * Extract building height from OSM tags
 * @param {Object} tags - OSM tags object
 * @returns {number} Height in meters
 */
export function extractBuildingHeight(tags) {
    if (!tags) return 10;

    // Check for explicit height
    if (tags.height) {
        const height = parseFloat(tags.height);
        if (!isNaN(height)) return height;
    }

    // Estimate from building:levels
    if (tags['building:levels']) {
        const levels = parseInt(tags['building:levels']);
        if (!isNaN(levels)) return levels * 3; // 3 meters per floor
    }

    // Default height
    return 10;
}

/**
 * Process Overpass JSON to extract building data
 * @param {Object} overpassData - Raw Overpass API response
 * @param {number} centerLat - Center latitude for coordinate conversion
 * @param {number} centerLng - Center longitude for coordinate conversion
 * @returns {Array<Object>} Array of building objects with geometry and metadata
 */
export function processOSMBuildings(overpassData, centerLat, centerLng) {
    if (!overpassData || !overpassData.elements) {
        return [];
    }

    const nodes = {};
    const buildings = [];

    // First pass: collect all nodes
    overpassData.elements.forEach(element => {
        if (element.type === 'node') {
            nodes[element.id] = { lat: element.lat, lon: element.lon };
        }
    });

    // Second pass: process ways (buildings)
    overpassData.elements.forEach(element => {
        if (element.type === 'way' && element.tags && element.tags.building) {
            const coords = element.nodes
                .map(nodeId => nodes[nodeId])
                .filter(node => node !== undefined)
                .map(node => ({ lat: node.lat, lng: node.lon }));

            if (coords.length < 3) return; // Skip invalid polygons

            const centroid = calculateCentroid(coords);
            const height = extractBuildingHeight(element.tags);

            // Convert coordinates to local meters
            const localCoords = coords.map(coord =>
                latLngToMeters(coord.lat, coord.lng, centerLat, centerLng)
            );

            buildings.push({
                osmId: `way/${element.id}`,
                name: element.tags.name || '',
                buildingType: element.tags.building,
                height,
                levels: element.tags['building:levels'] ? parseInt(element.tags['building:levels']) : undefined,
                centroid,
                coords: localCoords,
                tags: element.tags
            });
        }
    });

    return buildings;
}

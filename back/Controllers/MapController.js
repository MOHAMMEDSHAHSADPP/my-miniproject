const Town = require('../Models/Town');

/**
 * MapController - Simplified for Mapbox (no OSM data fetching needed)
 */

/**
 * Get town configuration for map initialization
 * Mapbox handles all the map data, we just need town center coordinates
 */
exports.getTownConfig = async (req, res) => {
    try {
        const { slug } = req.query;

        if (!slug) {
            return res.status(400).json({ message: 'Town slug is required' });
        }

        const town = await Town.findOne({ slug, active: true });

        if (!town) {
            return res.status(404).json({ message: 'Town not found' });
        }

        res.json({
            townName: town.townName,
            slug: town.slug,
            centerLat: town.centerLat,
            centerLon: town.centerLon,
            radiusKm: town.radiusKm
        });
    } catch (error) {
        console.error('Error fetching town config:', error);
        res.status(500).json({ message: 'Server error fetching town configuration' });
    }
};

/**
 * Note: Building metadata is handled by BuildingController
 * Mapbox provides all map tiles, 3D buildings, roads, etc.
 * We only manage custom building metadata (names, types, images)
 */

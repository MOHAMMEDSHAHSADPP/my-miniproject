const Town = require("../Models/Town");
const audit = require("../utils/audit");

// ========== ADMIN ENDPOINTS ==========

// List all towns (admin) - Exclude layout for performance
exports.listTowns = async (req, res) => {
    try {
        const towns = await Town.find().select('-layout').sort({ townName: 1 });
        res.json(towns);
    } catch (e) {
        res.status(500).json({ message: "Failed to list towns", error: e.message });
    }
};

// Get single town (admin)
exports.getTown = async (req, res) => {
    try {
        const town = await Town.findById(req.params.id);
        if (!town) return res.status(404).json({ message: "Town not found" });

        // Access Control
        const user = req.user;
        const isSuper = (user.adminRole === 'super_admin') || (user.isAdmin === true);
        const isTownAdmin = (user.adminRole === 'town_admin') && (user.adminTownSlug === town.townSlug);

        console.log(`[AUTH] User: ${user.email} (Role: ${user.adminRole}, Slug: ${user.adminTownSlug}) -> Target: ${town.townSlug} | ALLOWED: ${isSuper || isTownAdmin}`);

        if (!isSuper && !isTownAdmin) {
            return res.status(403).json({ message: "Permission Denied: You cannot access this town's data." });
        }

        res.json(town);
    } catch (e) {
        res.status(500).json({ message: "Failed to get town", error: e.message });
    }
};

// Update Town Map Layout + Settings
exports.updateLayout = async (req, res) => {
    try {
        const { id } = req.params;
        const { layout, mapSettings } = req.body;
        const user = req.user;

        // 1. Get Town (lean for permission check only)
        const town = await Town.findById(id).select('townSlug');
        if (!town) {
            return res.status(404).json({ message: 'Town not found' });
        }

        // 2. Check Permissions
        const isSuper = (user.adminRole === 'super_admin') || (user.isAdmin === true);
        const isTownAdmin = (user.adminRole === 'town_admin') && (user.adminTownSlug === town.townSlug);

        if (!isSuper && !isTownAdmin) {
            return res.status(403).json({
                message: 'Permission Denied: You can only edit the map for your assigned town.'
            });
        }

        // 3. Build update object — use $set to bypass validation
        const update = {};
        if (layout !== undefined) update.layout = layout;
        if (mapSettings) update.mapSettings = mapSettings;

        await Town.findByIdAndUpdate(id, { $set: update }, { runValidators: false });

        res.json({ success: true, layoutCount: (layout || []).length });
    } catch (error) {
        console.error('Error updating town layout:', error.message);
        res.status(500).json({ message: 'Server error updating layout', error: error.message });
    }
};

// Create town
exports.createTown = async (req, res) => {
    try {
        const { townName, district, about, centerLat, centerLon, radiusKm, active, state, country } = req.body;

        if (!townName || centerLat === undefined || centerLon === undefined) {
            return res.status(400).json({ message: "townName, centerLat, and centerLon are required" });
        }

        const town = new Town({
            townName,
            district,
            about,
            centerLat,
            centerLon,
            radiusKm: radiusKm || 2,
            active: active !== undefined ? active : true,
            state,
            country
        });

        await town.save();

        await audit({
            actor: req.user,
            module: "town",
            action: "create",
            entityType: "Town",
            entityId: town._id,
            message: `Created town: ${townName}`
        });

        res.status(201).json(town);
    } catch (e) {
        res.status(500).json({ message: "Failed to create town", error: e.message });
    }
};

// Update town
exports.updateTown = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const town = await Town.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        if (!town) {
            return res.status(404).json({ message: "Town not found" });
        }

        await audit({
            actor: req.user,
            module: "town",
            action: "update",
            entityType: "Town",
            entityId: town._id,
            message: `Updated town: ${town.townName}`
        });

        res.json(town);
    } catch (e) {
        res.status(500).json({ message: "Failed to update town", error: e.message });
    }
};

// Delete town
exports.deleteTown = async (req, res) => {
    try {
        const { id } = req.params;

        const town = await Town.findById(id);
        if (!town) {
            return res.status(404).json({ message: "Town not found" });
        }

        // Soft delete by setting active to false
        town.active = false;
        await town.save();

        await audit({
            actor: req.user,
            module: "town",
            action: "delete",
            entityType: "Town",
            entityId: town._id,
            message: `Deleted town: ${town.townName}`
        });

        res.json({ message: "Town deleted (deactivated)" });
    } catch (e) {
        res.status(500).json({ message: "Failed to delete town", error: e.message });
    }
};

// ========== PUBLIC ENDPOINTS ==========

// List active towns (public)
exports.getActiveTowns = async (req, res) => {
    try {
        const towns = await Town.find({ active: true })
            .select('townName townSlug centerLat centerLon radiusKm district state')
            .sort({ townName: 1 })
            .lean();
        res.json(towns);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch towns", error: e.message });
    }
};

// Get town by slug (public)
exports.getTownBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const town = await Town.findOne({ townSlug: slug, active: true })
            .select('townName townSlug centerLat centerLon radiusKm district state about layout')
            .lean();

        if (!town) {
            return res.status(404).json({ message: "Town not found" });
        }

        res.json(town);
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch town", error: e.message });
    }
};

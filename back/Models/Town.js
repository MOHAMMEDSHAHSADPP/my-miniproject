const mongoose = require("mongoose");

const TownSchema = new mongoose.Schema(
  {
    // Basic info
    district: String,
    townName: { type: String, required: true, trim: true },
    townSlug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    about: String,

    // Map configuration (NEW)
    centerLat: {
      type: Number,
      required: false,
      default: 0,
      min: -90,
      max: 90
    },
    centerLon: {
      type: Number,
      required: false,
      default: 0,
      min: -180,
      max: 180
    },
    radiusKm: {
      type: Number,
      default: 2,
      min: 0.5,
      max: 5
    },
    radiusKm: { type: Number, default: 2 }, // Kept for legacy compatibility
    active: { type: Boolean, default: true },

    // Custom Map Layout — v5 Professional
    layout: [{
      id: String,
      type: { type: String, enum: ['road', 'building', 'water', 'park', 'prop', 'bridge', 'tunnel', 'streetlight', 'signal', 'busstop', 'parking'] },
      subType: String,
      x: Number,
      z: Number,
      width: Number,
      depth: Number,
      height: Number,
      rotation: { type: Number, default: 0 },
      color: String,
      name: String,
      active: { type: Boolean, default: true },
      linkedBuildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },

      // Road-specific
      roadMode: { type: String, enum: ['straight', 'bezier', 'spline'], default: 'straight' },
      curvePoints: [{ x: Number, y: Number, z: Number }], // Control/path points
      lanes: { type: Number, default: 2 },
      oneWay: { type: Boolean, default: false },
      sidewalk: { type: Boolean, default: false },
      divider: { type: Boolean, default: false },
      roadLength: Number, // Computed length in units

      // Building-specific
      buildingTemplate: String, // house, apartment, school, hospital, office, mall, shop, warehouse
      description: String,
      image: String,

      // Hashtag Label
      hashtag: {
        enabled: { type: Boolean, default: false },
        text: String,
        icon: String,
        color: { type: String, default: '#ffffff' },
        size: { type: Number, default: 1 },
        heightOffset: { type: Number, default: 2 },
        alwaysVisible: { type: Boolean, default: true },
        occlusionTest: { type: Boolean, default: false }
      },

      // Event/Status Overlay (for roads)
      eventStatus: {
        type: { type: String, enum: ['none', 'traffic', 'emergency', 'accident', 'closed'], default: 'none' },
        description: String,
        timestamp: Date,
        active: { type: Boolean, default: false }
      },

      // Infrastructure-specific
      infraType: String, // bridge, flyover, tunnel, river, park, streetlight, signal
      elevation: { type: Number, default: 0 },
      instanceCount: Number // For repeated objects (trees, lights)
    }],

    // Editor Settings (persisted per town)
    mapSettings: {
      gridSnap: { type: Boolean, default: true },
      gridSize: { type: Number, default: 2 },
      showShadows: { type: Boolean, default: false },
      autosave: { type: Boolean, default: false },
      cameraPosition: { x: Number, y: Number, z: Number },
      cameraTarget: { x: Number, y: Number, z: Number }
    },

    // Optional metadata
    state: { type: String, default: "Kerala" },
    country: { type: String, default: "India" }
  },
  { timestamps: true }
);

// Index for active towns query
TownSchema.index({ active: 1, townSlug: 1 });

// Pre-save hook to generate slug from name if not provided
TownSchema.pre("save", function (next) {
  if (!this.townSlug && this.townName) {
    this.townSlug = this.townName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

// Method to calculate bounding box
TownSchema.methods.getBoundingBox = function () {
  if (this.centerLat == null || this.centerLon == null) return null;

  const R = 6371; // Earth radius in km
  const latDelta = (this.radiusKm / R) * (180 / Math.PI);
  // Avoid division by zero at poles, though unlikely with standard coords
  const cosLat = Math.cos(this.centerLat * Math.PI / 180) || 0.0001;
  const lonDelta = (this.radiusKm / (R * cosLat)) * (180 / Math.PI);

  return {
    minLat: this.centerLat - latDelta,
    maxLat: this.centerLat + latDelta,
    minLon: this.centerLon - lonDelta,
    maxLon: this.centerLon + lonDelta
  };
};

// Method to get Overpass bbox string
TownSchema.methods.getOverpassBbox = function () {
  const bbox = this.getBoundingBox();
  if (!bbox) return "0,0,0,0";
  return `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`;
};

module.exports = mongoose.model("Town", TownSchema);


const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
    {
        townSlug: {
            type: String,
            required: true,
            index: true,
        },
        townName: {
            type: String,
            trim: true,
        },

        // Categories: On-Demand, Government, Emergency
        category: {
            type: String,
            required: true,
            enum: ["on_demand", "govt", "emergency"],
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        icon: {
            type: String, // /uploads/visitor/xxx.png
            required: true,
        },

        // Action: Link or Phone
        link: {
            type: String,
            trim: true,
            default: "",
        },


        description: {
            type: String,
            trim: true,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);

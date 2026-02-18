const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const Trending = require('./Models/Trending');
const Town = require('./Models/Town');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
    } catch (err) {
        process.exit(1);
    }
};

const check = async () => {
    await connectDB();

    let output = '';

    output += '--- TOWNS ---\n';
    const towns = await Town.find({});
    towns.forEach(t => {
        output += `Town: ${t.townName}, Hero: ${t.heroImage}\n`;
    });

    output += '\n--- TRENDING ---\n';
    const trends = await Trending.find({});
    trends.forEach(t => {
        output += `Title: ${t.title}, Image: ${t.image}\n`;
    });

    fs.writeFileSync('db_dump.txt', output);
    mongoose.connection.close();
};

check();

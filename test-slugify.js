const slugify = require("slugify");
console.log("Slugify loaded:", typeof slugify);
console.log("Test slug:", slugify("Hello World", { lower: true, strict: true }));

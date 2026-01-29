const ImageKit = require("imagekit");
require("dotenv").config();

// console.log("-----------------------------------------");
// console.log("DEBUG: Initializing ImageKit Config...");

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    // console.error("DEBUG ERROR: IMAGEKIT_PRIVATE_KEY is missing in .env!");
}

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// console.log("DEBUG: ImageKit Configured Successfully.");
// console.log("-----------------------------------------");

module.exports = imagekit;
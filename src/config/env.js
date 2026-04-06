require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
};
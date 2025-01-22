const mongoose = require("mongoose");

const connection = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/vidpherBD");
        console.log("Connected to database: vidpherBD");
    } catch (error) {
        console.log("Error: ", error);
        throw new Error("Error in connection to database");
    }
}


module.exports = connection;
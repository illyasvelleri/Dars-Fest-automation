const mongoose = require('mongoose');

const state = {
  db: null,
};

// MongoDB connection string
const url = "mongodb://127.0.0.1:27017";
// Database name
const dbName = "Registration";

// Function to establish MongoDB connection
const connect = async (cb) => {
  try {
    // Connecting to MongoDB
    await mongoose.connect(`${url}/${dbName}`);
    // Setting up database name to the state
    state.db = mongoose.connection.db;
    // Callback after connected
    return cb();
  } catch (err) {
    // Callback when an error occurs
    return cb(err);
  }
};

// Function to get the database instance
const get = () => state.db;

// Exporting functions
module.exports = {
  connect,
  get,
};

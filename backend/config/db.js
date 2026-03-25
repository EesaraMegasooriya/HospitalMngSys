const { Pool, types } = require("pg"); 

require("dotenv").config();


types.setTypeParser(1082, function(stringValue) {
  return stringValue; // Returns exactly '2026-03-25'
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
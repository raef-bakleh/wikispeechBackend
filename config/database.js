require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "wikispeech",
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }
);

module.exports = sequelize;

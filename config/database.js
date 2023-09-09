// autossh -M 0 -o "ServerAliveInterval 30" -o "ServerAliveCountMax 3" -L 5432:postgres:5432 raef.bakleh@ssh.phonetik.uni-muenchen.de
require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "speechdb",
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }
);

module.exports = sequelize;

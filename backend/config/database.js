// ssh -L 5432:postgres:5432 raef.bakleh@ssh.phonetik.uni-muenchen.de
// psql -h localhost -U raef.bakleh speechdb
require("dotenv").config();

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
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

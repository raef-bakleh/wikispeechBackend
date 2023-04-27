("use strict");
const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const Link = sequelize.define(
    "Link",
    {
      lform: DataTypes.INTEGER,
      lto: DataTypes.INTEGER,
      label: DataTypes.TEXT,
      relposition: DataTypes.TEXT,
    },
    { tableName: "link", timestamps: false }
  );

  return Link;
};

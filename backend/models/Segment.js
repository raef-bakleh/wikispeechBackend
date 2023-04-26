const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");
("use strict");

module.exports = (sequelize, DataTypes) => {
  const Segment = sequelize.define(
    "Segment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tier: DataTypes.STRING,
      position: DataTypes.INTEGER,
      label: DataTypes.TEXT,
      begin: DataTypes.INTEGER,
      duration: DataTypes.INTEGER,
    },
    { tableName: "segment", timestamps: false }
  );

  return Segment;
};

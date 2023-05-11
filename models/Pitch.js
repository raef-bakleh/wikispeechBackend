const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

("use strict");
module.exports = (sequelize, DataTypes) => {
  const Pitch = sequelize.define(
    "Pitch",
    {
      sample: DataTypes.INTEGER,
      f0: DataTypes.INTEGER,
    },
    { tableName: "pitch", timestamps: false }
  );

  return Pitch;
};

("use strict");

const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Formant = sequelize.define(
    "Formant",
    {
      sample: DataTypes.INTEGER,
      f1: DataTypes.FLOAT,
      f2: DataTypes.FLOAT,
      f3: DataTypes.FLOAT,
    },
    { tableName: "formant", timestamps: false }
  );

  return Formant;
};

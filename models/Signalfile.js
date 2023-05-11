const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Speaker = require("./Speaker");
const Project = require("./Project");
const Pitch = require("./Pitch");
const Formant = require("./Formant");

("use strict");
module.exports = (sequelize, DataTypes) => {
  const Signalfile = sequelize.define(
    "Signalfile",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      filename: DataTypes.TEXT,
      filepath: DataTypes.TEXT,
      itemcode: DataTypes.STRING,
      distribution: DataTypes.BOOLEAN,
      samplerate: DataTypes.INTEGER,
      filesize: DataTypes.INTEGER,
      mode: DataTypes.TEXT,
      contents: DataTypes.TEXT,
      language: DataTypes.TEXT,
    },
    { tableName: "signalfile", timestamps: false }
  );

  return Signalfile;
};

const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");
("use strict");
module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.TEXT,
      contact: DataTypes.TEXT,
    },
    { tableName: "project", timestamps: false }
  );
  Project.associate = function (models) {
    Project.hasMany(models.Signalfile, { foreignKey: "project_id" });
  };
  return Project;
};

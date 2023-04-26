"use strict";

module.exports = (sequelize, DataTypes) => {
  const Geolocation = sequelize.define(
    "Geolocation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nuts: DataTypes.STRING,
      label: DataTypes.STRING,
      longitude: DataTypes.DOUBLE,
      latitude: DataTypes.DOUBLE,
      iso3166_2: DataTypes.STRING,
      dialect_region: DataTypes.STRING,
      reference: DataTypes.INTEGER,
    },
    { tableName: "geolocation", timestamps: false }
  );

  return Geolocation;
};

const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Geolocation = require("./../models/Geolocation")(sequelize, DataTypes);

async function getGeoData(req, res) {
  const geoData = await Geolocation.findAll();
  res.json(geoData);
}

module.exports = getGeoData;

const express = require("express");
const { Sequelize, DataTypes, where } = require("sequelize");
const sequelize = require("../config/database");
const Segment = require("./../models/Segment")(sequelize, DataTypes);
async function getAllTiers(req, res) {
  const tiers = await sequelize.models.Segment.findAll({
    attributes: [[sequelize.fn("DISTINCT", sequelize.col("tier")), "tier"]],
    order: ["tier"],
  });
  const response = {
    tiers: tiers,
  };
  res.json(tiers);
}

module.exports = getAllTiers;

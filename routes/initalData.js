const express = require("express");
const { Sequelize, DataTypes, where } = require("sequelize");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const Project = require("../models/Project")(sequelize, DataTypes);
async function getAllprojects(req, res) {
  const projects = await sequelize.models.Project.findAll({
    attributes: ["name"],
  });
  const response = {
    projects: projects,
  };
  res.json(projects);
}

module.exports = getAllprojects;

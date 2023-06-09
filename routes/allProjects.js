const express = require("express");
const { Sequelize, DataTypes, where } = require("sequelize");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

async function getAllProjects(req, res) {
  let query = `select distinct\n 
  pr.name as projectName
  from signalfile sig
  join segment ort on sig.id = ort.signalfile_id 
  join speaker spk on spk.id = sig.speaker_id
  join geolocation geo on geo.id=spk.geolocation_id
  join project pr on pr.id = sig.project_id
    `;

  const projects = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
  });
  let response = {
    projects: projects,
  };
  res.json(response);
}

module.exports = getAllProjects;

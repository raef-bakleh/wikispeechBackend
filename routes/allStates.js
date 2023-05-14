const express = require("express");
const { Sequelize, DataTypes, where } = require("sequelize");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

async function getInitialData(req, res) {
  let query = `select distinct\n 
  geo.iso3166_2 as state
  from signalfile sig
  join segment ort on sig.id = ort.signalfile_id 
  join speaker spk on spk.id = sig.speaker_id
  join geolocation geo on geo.id=spk.geolocation_id
  join project pr on pr.id = sig.project_id
  where
     ort.tier = 'ORT'    `;

  const states = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
  });
  let response = {
    states: [
      ...new Set(
        states.map((word) => {
          return word.state;
        })
      ),
    ],
  };
  res.json(response);
}

module.exports = getInitialData;

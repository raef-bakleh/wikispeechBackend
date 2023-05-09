const express = require("express");
const { Sequelize, DataTypes, where } = require("sequelize");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

async function getWords(req, res) {
  const age = req.query.age;
  const gender = req.query.gender;
  const state = req.query.state;
  const project = req.query.project;
  const tier = req.query.tier;
  const selectedWord = req.query.selectedWord;
  const ageRange = req.query.ageRange.split(",");
  const regex = req.query.regex;
  const phoneme = req.query.phoneme;
  const city = req.query.city;
  const mauOrt = req.query.mauOrt;
  const compareStates = req.query.compareStates;

  let whereClause = [];

  if (age != 0 && age != "undefined") {
    whereClause.push(`spk.age = ${age}`);
  }
  if (ageRange[0] !== "" && ageRange[1] !== "") {
    whereClause.push(`spk.age between ${ageRange[0]} and ${ageRange[1]}`);
  }
  if (selectedWord) {
    tier == "ORT" && whereClause.push(`ort.label = '${selectedWord}'`);
    tier == "MAU" && whereClause.push(`mau.label = '${selectedWord}'`);
    tier == "KAN" && whereClause.push(`kan.label = '${selectedWord}'`);
  }
  if (project) {
    const projects = project.split(",");
    if (projects.length > 1) {
      whereClause.push(
        `pr.name IN (${projects.map((s) => `'${s}'`).join(", ")})`
      );
    } else {
      whereClause.push(`pr.name = '${projects[0]}'`);
    }
  }
  if (tier) {
    (tier == "" || tier == "ORT") && whereClause.push(`ort.tier = '${tier}'`);
    tier == "MAU" && whereClause.push(`mau.tier = '${tier}'`);
    tier == "MAU" && mauOrt === "true" && whereClause.push(`ort.tier = 'ORT'`);

    tier == "KAN" && whereClause.push(`kan.tier = '${tier}'`);
  }
  if (city) {
    whereClause.push(`geo.label = '${city}'`);
  }
  if (gender) {
    const genders = gender.split(",");
    if (genders.length > 1) {
      whereClause.push(
        `spk.sex in (${genders.map((s) => `'${s}'`).join(", ")})`
      );
    } else {
      whereClause.push(`spk.sex = '${genders[0]}'`);
    }
  }

  if (state) {
    whereClause.push(`geo.iso3166_2 = '${state}'`);
  }


  if (regex) {
    whereClause.push(`ort.label ~ '${regex}'`);
  }
  if (phoneme) {
    whereClause.push(`mau.label = '${phoneme}'`);
  }

  let query = `select distinct\n   `;

  if (tier) {
    (tier == "" || tier == "ORT") && (query += `ort.label as words,\n   `);
    tier == "MAU" && (query += `mau.label as label,\n   `);
    tier == "KAN" && (query += `kan.label as words,\n   `);
  }


  if (phoneme) {
    query += `mau.label as phoneme,\n   `;
  }
  if (mauOrt === "true") {
    query += `ort.label as words,\n `;
  }
  query += `pr.name as projectName,\n   spk.sex as sex,\n   spk.age as age,\n   geo.iso3166_2 as state,\n   geo.label as city\nfrom signalfile sig\n`;

  (tier == "" || tier == "ORT") &&
    (query += `join segment ort on sig.id = ort.signalfile_id \n`);
  tier == "MAU" &&
    mauOrt === "false" &&
    (query += `join segment mau on sig.id = mau.signalfile_id \n`);
  tier == "MAU" &&
    mauOrt === "true" &&
    (query += `join segment ort on sig.id = ort.signalfile_id \n`);
  tier == "KAN" &&
    (query += `join segment kan on sig.id = kan.signalfile_id \n`);
  if (phoneme) {
    query += `join links l on l.lto = ort.id\njoin segment mau on mau.id = l.lfrom\n`;
  }
  if (mauOrt === "true") {
    query += `join links l on l.lto = ort.id\njoin segment mau on mau.id = l.lfrom\n`;
  }

  query += `join speaker spk on sig.speaker_id = spk.id\njoin geolocation geo on spk.geolocation_id = geo.id\njoin project pr on sig.project_id = pr.id\n`;

  if (whereClause.length > 0) {
    query += `where\n   ${whereClause.join(" and\n   ")}`;
  }

  const words = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
  });
  let response = {
    words: words,
  };
  res.json(response);
}

module.exports = getWords;

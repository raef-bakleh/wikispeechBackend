const express = require("express");
const { Sequelize, DataTypes, where } = require("sequelize");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

async function getSpeakerCount(req, res) {
  const age = req.query.age;
  const gender = req.query.gender;
  const state = req.query.state;
  const tier = req.query.tier;
  const project = req.query.project;
  const selectedWord = req.query.selectedWord;
  const ageRange = req.query.ageRange.split(",");
  const city = req.query.city;
  const compareStates = req.query.compareStates;
  const ortRegex = req.query.ortRegex;
  const mauRegex = req.query.mauRegex;
  const phoneme = req.query.phoneme;
  const mauOrt = req.query.mauOrt;

  let joinKan = false;
  let joinOrt = false;
  let whereClause = [];

  if (age != 0 && age != "undefined") {
    whereClause.push(`spk.age = ${age}`);
  }
  if (ageRange[0] !== "" && ageRange[1] !== "") {
    whereClause.push(`spk.age between ${ageRange[0]} and ${ageRange[1]}`);
  }
  if (selectedWord) {
    whereClause.push(`${tier}.label = '${selectedWord}'`);
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
  if (tier && !joinKan && !joinOrt) {
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

  if (state && compareStates === "false") {
    whereClause.push(`geo.iso3166_2 = '${state}'`);
  }
  if (compareStates === "true" && state) {
    whereClause.push(`geo.iso3166_2 LIKE '${state.split("-")[0]}-%'`);
  }
  if (ortRegex) {
    whereClause.push(`ort.label ~ '${ortRegex}'`);
    if (tier != "ORT") {
      whereClause.push(`ort.tier = 'ORT'`);
      joinOrt = true;
    }
  }
  if (mauRegex) {
    whereClause.push(`kan.label ~ '${mauRegex}'`);
    if (tier != "KAN") {
      whereClause.push(`kan.tier = 'KAN'`);
      joinKan = true;
    }
  }
  if (phoneme) {
    whereClause.push(`mau.label = '${phoneme}'`);
  }

  let query = `select 
  count(distinct case when spk.sex = 'm' then spk.id end) as male_count,
  count(distinct case when spk.sex = 'f' then spk.id end) as female_count,
  spk.sex
  from signalfile sig\n`;

  if (tier && !joinKan && !joinOrt) {
    query += `join segment ${tier} on sig.id = ${tier}.signalfile_id \n`;
  }
  if (phoneme) {
    query += `join links l on l.lto = ${tier}.id\njoin segment mau on mau.id = l.lfrom\n`;
  }
  if (joinKan) {
    query += `join segment ort on sig.id = ort.signalfile_id\njoin links l on l.lto = ort.id\njoin segment kan on kan.id = l.lfrom\n`;
  }
  if (joinOrt) {
    query += `join segment ort on sig.id = ort.signalfile_id\njoin links l on l.lto = ort.id\njoin segment kan on kan.id = l.lfrom\n`;
  }
  if (mauOrt === "true") {
    query += `join links l on l.lto = ${tier}.id\njoin segment mau on mau.id = l.lfrom\n`;
  }

  query += `
join Speaker spk on sig.speaker_id = spk.id\n
join Geolocation geo on spk.geolocation_id = geo.id\n
join Project pr on sig.project_id = pr.id\n`;

  if (Object.keys(whereClause).length > 0) {
    const whereClauses = Object.keys(whereClause).map((key) => {
      const value = whereClause[key];
      if (typeof value === "object") {
        const operator = Object.keys(value)[0];
        return `\`${key}\` ${operator} '${value[operator]}'`;
      } else {
        return `${value}`;
      }
    });
    query += `\nwhere ${whereClauses.join(" \nand ")} `;
  }

  query += ` \ngroup by
  spk.sex
`;

  const count = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
  });
  let response = {
    count: count,
  };
  res.json(response);
}

module.exports = getSpeakerCount;

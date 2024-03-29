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
  const kanRegex = req.query.kanRegex;
  const mauVocal = req.query.mauVocal;
  const phoneme = req.query.phoneme;
  const mauOrt = req.query.mauOrt;

  let joinKan = false;
  let joinOrt = false;
  let joinMau = false;
  let whereClause = [];

  const phonemeWithoutSeperator = phoneme.split(",");
  const phonemeWithString = phonemeWithoutSeperator
    .map((vocal) => `'${vocal}'`)
    .join(",");

  if (age != 0 && age != "undefined") {
    whereClause.push(`spk.age = ${age}`);
  }
  if (ageRange[0] !== "" && ageRange[1] !== "") {
    whereClause.push(`spk.age between ${ageRange[0]} and ${ageRange[1]}`);
  }
  if (selectedWord) {
    whereClause.push(`${tier}.label = '${selectedWord.replace(/'/g, "\\'")}'`);
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
  if (tier && !joinKan && !joinOrt && !joinMau) {
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
    whereClause.push(`ort.label ~* '${ortRegex}'`);
    if (tier != "ORT") {
      whereClause.push(`ort.tier = 'ORT'`);
      joinOrt = true;
    }
  }
  if (kanRegex) {
    whereClause.push(`kan.label ~* '${kanRegex.replace(/'/g, "''")}'`);
    if (tier != "KAN") {
      whereClause.push(`kan.tier = 'KAN'`);
      whereClause.push(`kan.position = ort.position`);
      joinKan = true;
    }
  }
  if (phoneme) {
    if (tier != "MAU") {
      whereClause.push(`mau.tier = 'MAU'`);
      joinMau = true;
    }
    if (phonemeWithoutSeperator.length == 1) {
      whereClause.push(`mau.label = '${phoneme}' and\n   mau.tier='MAU'`);
    }
    if (phonemeWithoutSeperator.length > 1) {
      whereClause.push(`mau.label in (${phonemeWithString})`);
    }
  }

  let query = `SELECT DISTINCT ${
    kanRegex || ortRegex || phoneme ? `${tier}.id as id,` : ""
  } spk.id as speaker_id, spk.sex
   from signalfile sig\n`;

  if (tier && !joinOrt && !joinMau) {
    query += `join segment ${tier} on sig.id = ${tier}.signalfile_id \n`;
  }
  if (joinKan) {
    query += `join segment kan on sig.id = kan.signalfile_id \n`;
  }
  if (joinOrt) {
    if (tier == "KAN") {
      whereClause.push(`kan.position = ort.position`);
      query += `join segment ort on sig.id = ort.signalfile_id\n    join segment kan on sig.id = kan.signalfile_id\n    `;
    } else {
      query += `join segment ort on sig.id = ort.signalfile_id\njoin links l on l.lto = ort.id\njoin segment ${tier.toLowerCase()} on ${tier.toLowerCase()}.id = l.lfrom\n`;
    }
  }
  if (joinMau) {
    query += `join segment ort on sig.id = ort.signalfile_id\njoin links l on l.lto = ort.id\njoin segment mau on mau.id = l.lfrom\n`;
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

  if (phonemeWithoutSeperator.length > 1) {
    query += `group by ort.id,spk.id,spk.sex having ARRAY[${phonemeWithString}] <@ array_agg(mau.label)  `;
  } else {
    query += ` \ngroup by spk.id, ${tier}.id 
`;
  }

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

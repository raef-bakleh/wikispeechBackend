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
  const ortRegex = req.query.ortRegex;
  const kanRegex = req.query.kanRegex;
  const mauRegex = req.query.mauRegex;
  const phoneme = req.query.phoneme;
  const city = req.query.city;
  const mauOrt = req.query.mauOrt;
  const compareStates = req.query.compareStates;

  const phonemeWithoutSeperator = phoneme.split(",");
  const phonemeWithString = phonemeWithoutSeperator
    .map((vocal) => `'${vocal}'`)
    .join(",");

  let joinKan = false;
  let joinOrt = false;
  let joinMau = false;

  let whereClause = [];
  let selectedForGroupBy = [
    "pr.name",
    "spk.sex",
    "spk.id",
    "spk.age",
    "geo.iso3166_2",
    "geo.label",
  ];

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

  if (state) {
    whereClause.push(`geo.iso3166_2 = '${state}'`);
  }

  if (ortRegex) {
    whereClause.push(`ort.label ~* '${ortRegex}'`);
    if (tier != "ORT") {
      whereClause.push(`ort.tier = 'ORT'`);
      joinOrt = true;
    }
  }
  if (kanRegex) {
    whereClause.push(`kan.label ~* '${kanRegex.replace(/'/g, "\\'")}'`);
    if (tier != "KAN") {
      whereClause.push(`kan.tier = 'KAN'`);
      whereClause.push(`kan.position = ort.position`);
      selectedForGroupBy.push("kan.label");
      joinKan = true;
    }
  }
  if (phoneme) {
    if (tier != "MAU") {
      whereClause.push(`mau.tier = 'MAU'`);
      joinMau = true;
    }
    if (phoneme.length == 1) {
      whereClause.push(`mau.label = '${phoneme}' and\n   mau.tier='MAU'`);
    }
    if (phoneme.length > 1) {
      whereClause.push(`mau.label in (${phonemeWithString})`);
    }
  }

  let query = `select distinct\n    `;

  if (tier) {
    if (tier === "ORT" || tier === "") {
      query += `ort.label as words,\n   `;
      if (phoneme) {
        if (phoneme.length === 1) {
          query += `mau.label as phoneme,\n   `;
        }
        if (phoneme.length > 1) {
          query += `array_agg(mau.label order by mau.begin) as phoneme,\n   `;
        }
      }
    }

    if (tier === "MAU") {
      if (phoneme) {
        if (phoneme.length === 1) {
          query += `mau.label as phoneme,\n   `;
        }
        if (phoneme.length > 1) {
          query += `array_agg(mau.label order by mau.begin) as phoneme,\n   `;
        }
      } else {
        query += `mau.label as phoneme,\n   `;
      }
    }

    if (tier === "KAN") {
      query += `kan.label as words,\n   `;
      if (phoneme) {
        if (phoneme.length === 1) {
          query += `mau.label as phoneme,\n   `;
        }
        if (phoneme.length > 1) {
          query += `array_agg(mau.label order by mau.begin) as phoneme,\n   `;
        }
      }
    }

    selectedForGroupBy.push(`${tier.toLowerCase()}.label`);
    selectedForGroupBy.push(`${tier.toLowerCase()}.id`);
  }
  if (joinKan) {
    query += `kan.label as word,\n   `;
  }
  if (joinOrt) {
    query += `ort.label as word,\n   `;
  }

  if (mauOrt === "true") {
    query += `${tier}.label as words,\n `;
  }
  query += `pr.name as projectName,\n   spk.sex as sex,\n   spk.age as age,\n   geo.iso3166_2 as state,\n   geo.label as city\nfrom signalfile sig\n`;

  if (tier && !joinOrt && !joinMau) {
    query += `join segment ${tier} on sig.id = ${tier}.signalfile_id \n`;
  }

  if (joinKan) {
    query += `join segment kan on sig.id = kan.signalfile_id \n`;
  }
  if (joinOrt) {
    if (tier == "KAN") {
      whereClause.push(`kan.position = ort.position`);
      selectedForGroupBy.push("kan.label");
      query += `join segment ort on sig.id = ort.signalfile_id\n    join segment kan on sig.id = kan.signalfile_id\n    `;
    } else {
      selectedForGroupBy.push(`ort.label`);
      query += `join segment ort on sig.id = ort.signalfile_id\njoin links l on l.lto = ort.id\njoin segment ${tier.toLowerCase()} on ${tier.toLowerCase()}.id = l.lfrom\n`;
    }
  }
  if (joinMau) {
    query += `join segment ort on sig.id = ort.signalfile_id\njoin links l on l.lto = ort.id\njoin segment mau on mau.id = l.lfrom\n`;
  }
  if (mauOrt === "true") {
    query += `join links l on l.lto = ${tier}.id\njoin segment mau on mau.id = l.lfrom\n`;
  }

  query += `join speaker spk on sig.speaker_id = spk.id\njoin geolocation geo on spk.geolocation_id = geo.id\njoin project pr on sig.project_id = pr.id\n`;

  if (whereClause.length > 0) {
    query += `where\n   ${whereClause.join(" and\n   ")}`;
  }
  if (phoneme.length > 1) {
    const groupByColumns = selectedForGroupBy.join(", ");
    query += `\ngroup by ${groupByColumns}\n`;
    query += `having array_agg(mau.label ORDER BY mau.begin) @> ARRAY[${phonemeWithString}]`;
  }
  const words = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
  });
  let response = {
    words: words,
    query: query,
  };
  res.json(response);
}

module.exports = getWords;

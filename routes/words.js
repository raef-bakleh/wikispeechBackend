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

  let whereClause = [];

  if (age != 0 && age != "undefined") {
    whereClause.push(`spk.age = ${age}`);
  }
  if (ageRange[0] !== "" && ageRange[1] !== "") {
    whereClause.push(`spk.age between ${ageRange[0]} and ${ageRange[1]}`);
  }
  if (selectedWord) {
    whereClause.push(`ort.label = '${selectedWord}'`);
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
    whereClause.push(`ort.tier = '${tier}'`);
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
    // const likeQuery = regexToLikeQuery(regex);
    whereClause.push(`ort.label ~ '${regex}'`);
  }

  let query = `select distinct
    ort.label as words,
    pr.name as ProjectName,
    spk.sex as sex,
    spk.age as age,
    geo.iso3166_2 as state,
    geo.label as city
from signalfile sig
join segment ort on sig.id = ort.signalfile_id \n
join speaker spk on sig.speaker_id = spk.id\n
join geolocation geo on spk.geolocation_id = geo.id\n
join project pr on sig.project_id = pr.id\n`;

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

  // query += ` \ngroup by
  // ort.label,
  // pr.name,
  // spk.sex,
  // spk.age,
  // geo.iso3166_2,
  // geo.label`;

  const words = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
  });
  let response = {
    query: query,
    words: words,
  };
  res.json(response);
}

module.exports = getWords;

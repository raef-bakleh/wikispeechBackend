const express = require("express");
const { Sequelize, DataTypes, where } = require("sequelize");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

async function getDynamicQuery(req, res) {
  const age = req.query.age;
  const gender = req.query.gender;
  const state = req.query.state;
  const project = req.query.project;
  const tier = req.query.tier;
  const selectedWord = req.query.selectedWord;
  const ageRange = req.query.ageRange.split(",");
  const ortRegex = req.query.ortRegex;
  const mauRegex = req.query.mauRegex;
  const phoneme = req.query.phoneme;
  const city = req.query.city;
  const mauOrt = req.query.mauOrt;
  const compareStates = req.query.compareStates;

  const convertIsoToState = (isoCode) => {
    switch (isoCode) {
      case "DE-BY":
        return "Bayern";
      case "DE-BW":
        return "Baden-Württemberg";
      case "DE-BE":
        return "Berlin";
      case "DE-BB":
        return "Brandenburg";
      case "DE-HB":
        return "Bremen";
      case "DE-HH":
        return "Hamburg";
      case "DE-HE":
        return "Hessen";
      case "DE-MV":
        return "Mecklenburg-Vorpommern";
      case "DE-NI":
        return "Niedersachsen";
      case "DE-NW":
        return "Nordrhein-Westfalen";
      case "DE-RP":
        return "Rheinland-Pfalz";
      case "DE-SL":
        return "Saarland";
      case "DE-SN":
        return "Sachsen";
      case "DE-ST":
        return "Sachsen-Anhalt";
      case "DE-SH":
        return "Schleswig-Holstein";
      case "DE-TH":
        return "Thüringen";
      case "AT-1":
        return "Burgenland";
      case "AT-2":
        return "Kärnten";
      case "AT-3":
        return "Niederösterreich";
      case "AT-4":
        return "Oberösterreich";
      case "AT-5":
        return "Salzburg";
      case "AT-6":
        return "Steiermark";
      case "AT-7":
        return "Tirol";
      case "AT-8":
        return "Vorarlberg";
      case "AT-9":
        return "Wien";
      case "CH-AG":
        return "Aargau";
      case "CH-BE":
        return "Bern";
      case "CH-BS":
        return "Basel-Stadt";
      case "CH-GL":
        return "Glarus";
      case "CH-GR":
        return "Graubünden";
      case "CH-LU":
        return "Luzern";
      case "CH-SG":
        return "St. Gallen";
      case "CH-SH":
        return "Schaffhausen";
      case "CH-VS":
        return "Valais";
      case "CH-ZH":
        return "Zürich";
      case "BE-WLG":
        return "Lüttich";
      case "IT-31":
        return "Süd Tirol";
      case "IT-32":
        return "Süd Tirol";
      case "LU-L":
        return "Luxemburg";
      case "LI-11":
        return "Vaduz";
      case "LU-L":
        return "Luxemburg";
      default:
        return;
    }
  };

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

  let query = `select distinct\n   `;

  if (tier) {
    (tier == "" || tier == "ORT") && (query += `ort.label as words,\n   `);
    tier == "MAU" && (query += `mau.label as label,\n   `);
    tier == "KAN" && (query += `kan.label as words,\n   `);
  }
  if (joinKan) {
    query += `kan.label as word,\n   `;
  }
  if (joinOrt) {
    query += `ort.label as word,\n   `;
  }
  if (phoneme) {
    query += `mau.label as phoneme,\n   `;
  }
  if (mauOrt === "true") {
    query += `${tier}.label as words,\n `;
  }
  if (project) {
    query += `pr.name as projectName,\n   `;
  }
  if (gender) {
    query += `spk.sex as sex,\n   `;
  }
  if (
    (age != 0 && age != "undefined") ||
    (ageRange[0] !== "" && ageRange[1] !== "")
  ) {
    query += `spk.age as age,\n   `;
  }
  if (state && compareStates === "false") {
    query += `geo.iso3166_2 as state,\n   `;
  }
  if (compareStates === "true" && state) {
    query += `case when geo.iso3166_2 = '${state}' then '${convertIsoToState(
      state
    )}'else 'Other' end as state,\n   `;
  }
  if (city) {
    query += `geo.label as city,\n   `;
  }
  query = query.slice(0, -5);

  query += `\nfrom signalfile sig\n`;

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
  if (project) {
    query += `join project pr on sig.project_id = pr.id\n`;
  }
  if (
    (age != 0 && age != "undefined") ||
    (ageRange[0] !== "" && ageRange[1] !== "") ||
    gender
  ) {
    query += `join speaker spk on sig.speaker_id = spk.id\n`;
  }
  if (
    state &&
    query.includes(`join speaker spk on sig.speaker_id = spk.id\n`)
  ) {
    query += `join geolocation geo on spk.geolocation_id = geo.id\n`;
  }
  if (
    state &&
    !query.includes(`join speaker spk on sig.speaker_id = spk.id\n`)
  ) {
    query += `join speaker spk on sig.speaker_id = spk.id\njoin geolocation geo on spk.geolocation_id = geo.id\n`;
  }

  if (whereClause.length > 0) {
    query += `where\n   ${whereClause.join(" and\n   ")}`;
  }

  res.json(query);
}

module.exports = getDynamicQuery;

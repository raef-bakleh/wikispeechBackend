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
  const kanRegex = req.query.kanRegex;
  const phoneme = req.query.phoneme;
  const city = req.query.city;
  const mauOrt = req.query.mauOrt;
  const compareStates = req.query.compareStates;

  const phonemeWithoutSeperator = phoneme.split(",");
  const phonemeWithString = phonemeWithoutSeperator
    .map((vocal) => `'${vocal}'`)
    .join(",");

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
  let joinMau = false;
  let whereClause = [];
  let selectedForGroupBy = [];
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
    // if (phoneme.length > 1) {
    //   whereClause.push(`mau.label in (${phonemeWithString})`);
    // }
  }

  let query = `select distinct\n    ${tier.toLowerCase()}.id,\n    `;

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
    selectedForGroupBy.push(`kan.label`);
  }
  if (joinOrt) {
    query += `ort.label as word,\n   `;
    selectedForGroupBy.push(`ort.label`);
  }

  if (mauOrt === "true") {
    query += `${tier.toLowerCase()}.label as words,\n `;
  }
  if (project) {
    query += `pr.name as projectName,\n   `;
    selectedForGroupBy.push(`pr.name`);
  }
  if (gender) {
    query += `spk.sex as sex,\n   `;
    selectedForGroupBy.push(`spk.sex`);
  }
  if (
    (age != 0 && age != "undefined") ||
    (ageRange[0] !== "" && ageRange[1] !== "")
  ) {
    query += `spk.age as age,\n   `;
    selectedForGroupBy.push(`spk.age`);
  }
  if (state && compareStates === "false") {
    query += `geo.iso3166_2 as state,\n   `;
    selectedForGroupBy.push(`geo.iso3166_2 `);
  }
  if (compareStates === "true" && state) {
    query += `case when geo.iso3166_2 = '${state}' then '${convertIsoToState(
      state
    )}'else 'Other' end as state,\n   `;
    selectedForGroupBy.push(`geo.iso3166_2 `);
  }
  if (city) {
    query += `geo.label as city,\n   `;
    selectedForGroupBy.push(`geo.label `);
  }
  query = query.slice(0, -5);

  query += `\nfrom signalfile sig\n`;

  if (tier && !joinOrt && !joinMau) {
    query += `join segment ${tier} on sig.id = ${tier.toLowerCase()}.signalfile_id \n`;
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
      query += `join segment ort on sig.id = ort.signalfile_id\njoin links l on l.lto = ort.id\njoin segment ${tier.toLowerCase()} on ${tier.toLowerCase()}.id = l.lfrom\n`;
    }
  }
  if (joinMau) {
    query += `join segment ort on sig.id = ort.signalfile_id\njoin links l on l.lto = ort.id\njoin segment mau on mau.id = l.lfrom\n`;
  }
  if (mauOrt === "true") {
    query += `join links l on l.lto = ${tier.toLowerCase()}.id\njoin segment mau on mau.id = l.lfrom\n`;
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
  if (phoneme.length > 1) {
    const groupByColumns = selectedForGroupBy.join(",\n ");
    query += `\ngroup by ${groupByColumns}\n`;
    query += `   having array_agg(mau.label ORDER BY mau.begin) @> ARRAY[${phonemeWithString}]`;
  }

  res.json(query);
}

module.exports = getDynamicQuery;

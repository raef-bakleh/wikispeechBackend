const express = require("express");
const { Sequelize, Op } = require("sequelize");
const sequelize = require("../config/database");

async function generateQuery(req, res) {
  const gender = req.query.gender;
  const state = req.query.state;
  const project = req.query.project;
  const tier = req.query.tier;
  const selectedWord = req.query.selectedWord;
  const ageRange = req.query.ageRange?.split(",");
  const age = req.query.age;
  const regex = req.query.regex;

  const tables = [];
  const columns = [];
  const conditions = [];

  if (gender) {
    const genders = gender.split(",");
    if (genders.length > 1) {
      tables.push("speaker spk");
      columns.push("spk.sex, spk.age");
      conditions.push(
        `spk.sex in (${genders.map((s) => `'${s}'`).join(", ")})`
      );
    } else {
      tables.push("speaker spk");
      columns.push("spk.sex, spk.age");
      conditions.push(`spk.sex = '${genders[0]}'`);
    }
  }

  if (selectedWord) {
    tables.push("signalfile sig", "segment ort", "pitch pit");
    columns.push("ort.label, pit.f0");
    conditions.push(`ort.label = '${selectedWord}'`);
    if (tier) conditions.push(`ort.tier = '${tier}'`);
    conditions.push("pit.signalfile_id = sig.id");
    conditions.push("ort.sigfile_id = sig.id");
    conditions.push("sig.speaker_id = spk.id");
  }

  if (ageRange?.length === 2 && ageRange[0] && ageRange[1] !== undefined) {
    tables.push("speaker spk");
    columns.push("spk.age");
    conditions.push(`spk.age BETWEEN ${ageRange[0]} AND ${ageRange[1]}`);
  }

  if (state) {
    tables.push("geolocation geo", "speaker spk");
    columns.push("geo.label, geo.iso3166_2");
    conditions.push(`geo.iso3166_2 = '${state}'`);
    conditions.push("spk.geolocation_id = geo.id");
  }

  if (project) {
    tables.push("project pr", "signalfile sig", "speaker spk");
    columns.push("pr.name");
    conditions.push(`pr.name = '${project}'`);
    conditions.push("sig.project_id = pr.id");
    conditions.push("sig.speaker_id = spk.id");
    conditions.push("spk.project_id = pr.id");
  }

  if (tables.length === 0) {
    res.json({ query: "" });
    return;
  }

  let query = `SELECT ${columns.join(", ")} FROM ${tables[0]}`;

  for (let i = 1; i < tables.length; i++) {
    const prevTable = tables[i - 1];
    const currTable = tables[i];
    const relation = currTable === "speaker spk" ? "ON" : "JOIN";
    const prevTableAlias = prevTable.split(" ")[0];
    const currTableAlias = currTable.split(" ")[0];
    const condition = conditions
      .filter((c) => c.includes(prevTableAlias) && c.includes(currTableAlias))
      .join(" AND ");
    query += ` ${relation} ${currTable} ${condition ? ` ${condition}` : ""}`;
  }

  if (regex) {
    query += `WHERE CONCAT(${columns.join(", ")}) RLIKE '${regex}'`;
  }

  query += ";";

  res.json({ query });
}

// async function generateQuery(req, res) {
//   const filters = {
//     gender: { table: "speaker", columns: ["sex", "age"] },
//     state: { table: "geolocation", columns: ["label", "iso3166_2"] },
//     project: { table: "project", columns: ["name"] },
//     selectedWord: {
//       table: "signalfile",
//       columns: ["speaker_id"],
//       join: [
//         {
//           table: "segment",
//           columns: ["label"],
//           on: "ort.sigfile_id = sig.id",
//         },
//         {
//           table: "pitch",
//           columns: ["f0"],
//           on: "pit.signalfile_id = sig.id",
//         },
//       ],
//     },
//     tier: { table: "segment", columns: [] },
//     ageRange: { table: "speaker", columns: ["age"] },
//   };

//   const whereConditions = [];

//   Object.keys(filters).forEach((filter) => {
//     const value = req.query[filter];

//     if (value && filter !== "ageRange") {
//       const filterData = filters[filter];
//       const table = filterData.table;
//       const columns = filterData.columns;
//       const join = filterData.join;

//       if (join) {
//         join.forEach((joinData) => {
//           const joinTable = joinData.table;
//           const joinColumns = joinData.columns;
//           const joinOn = joinData.on;
//           whereConditions.push(
//             `${joinTable}.${joinColumns.join(", ")} = '${value}'`
//           );
//           whereConditions.push(joinOn);
//         });
//       } else {
//         columns.forEach((column) => {
//           whereConditions.push(`${table}.${column} = '${value}'`);
//         });
//       }
//     }
//   });

//   const query = `SELECT ${getSelectedColumns(filters)}
//     FROM ${getTables(filters)}
//     ${getJoins(filters)}
//     ${getWhereClause(whereConditions)}
//     ${getGroupBy(filters)};
//   `;

//   res.json({ query });
// }

module.exports = generateQuery;

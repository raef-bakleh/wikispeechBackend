const express = require("express");
const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");

async function runQuery(req, response) {
  const query = req.body.query;
  const tier = req.body.tier; // Retrieve the tier value from the request body

  if (!/^\s*SELECT/i.test(query)) {
    return response.send({
      error: true,
      message: "Invalid query: only SELECT queries are allowed",
    });
  }

  try {
    // Modify the query to include {tier}.id in the select clause
    let modifiedQuery;
    if (/SELECT\s+DISTINCT/i.test(query)) {
      modifiedQuery = query.replace(
        /SELECT\s+DISTINCT/i,
        `SELECT DISTINCT ${tier}.id as id,`
      );
    } else {
      modifiedQuery = query.replace(/SELECT/i, `SELECT ${tier}.id as id,`);
    }

    const result = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    response.send(result);
  } catch (error) {
    response.send({ error: true, message: error.original.message });
  }
}

module.exports = runQuery;

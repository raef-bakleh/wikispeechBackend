const express = require("express");
const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");

async function runQuery(req, response) {
  const query = req.body.query;
  if (!/^\s*SELECT/i.test(query)) {
    return response.send({
      error: true,
      message: "Invalid query: only SELECT queries are allowed",
    });
  }
  try {
    const result = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });
    response.send(result);
  } catch (error) {
    response.send({ error: true, message: error.original.message });
  }
}

module.exports = runQuery;

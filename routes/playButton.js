const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const axios = require("axios");

async function PlayButton(req, res) {
  const { id, tier } = req.query;
  let query;

  if (tier == "ORT") {
    query = `
      SELECT
      pr.name,
        ort.id,
        ort.label as words,
        MIN(mau.begin) / sig.samplerate::float as begin,
        (MAX(mau.begin) + MAX(mau.duration)) / sig.samplerate::float as duration,
        sig.speaker_id,
        sig.filename
      FROM
        signalfile sig
        join project pr on pr.id=sig.project_id
        JOIN segment ort ON sig.id = ort.signalfile_id
        JOIN links l ON l.lto = ort.id
        JOIN segment mau ON mau.id = l.lfrom
      WHERE
        ort.tier = 'ORT'
        AND mau.tier = 'MAU'
        ${tier == "ORT" ? `AND ort.id = ${id}` : ""}

        GROUP BY
        ort.id,
        pr.name,
        ort.label,
        sig.samplerate,
        sig.speaker_id,
        sig.filename;
    `;
  } else if (tier == "MAU") {
    query = `
    SELECT
    pr.name,
    mau.id,
    mau.label as words,
    (mau.begin) / sig.samplerate::float as begin,
    ((mau.begin) + (mau.duration)) / sig.samplerate::float as duration,
    sig.speaker_id,
    sig.filename
  FROM
    signalfile sig
    join project pr on pr.id=sig.project_id
    JOIN segment mau ON sig.id = mau.signalfile_id
  WHERE
     mau.tier = 'MAU'
     and mau.id = ${id}
    `;
  } else if (tier == "KAN") {
    query = `
    SELECT
    pr.name,
    ort.id,
    ort.label as words,
    MIN(mau.begin) / sig.samplerate::float as begin,
    (MAX(mau.begin) + MAX(mau.duration)) / sig.samplerate::float as duration,
    sig.speaker_id,
    sig.filename
  FROM
    signalfile sig
    join project pr on pr.id=sig.project_id
    JOIN segment ort ON sig.id = ort.signalfile_id
    JOIN links l ON l.lto = ort.id
    JOIN segment mau ON mau.id = l.lfrom
join segment kan on kan.signalfile_id = sig.id
  WHERE
ort.position=kan.position and
    ort.tier = 'ORT'
    AND mau.tier = 'MAU'
    AND kan.id = ${id}
  GROUP BY
    ort.id,
    pr.name,
    ort.label,
    sig.samplerate,
    sig.speaker_id,
    sig.filename
    `;
  }

  const segments = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT,
  });

  if (segments.length > 0) {
    const { name, speaker_id, filename, begin, duration } = segments[0];
    let url;
    if (name === "DEUTSCH_HEUTE") {
      url = `https://www.phonetik.uni-muenchen.de/forschung/Bas/Experimente/DeutschHeute/${filename}.wav`;
    } else {
      url = `https://www.phonetik.uni-muenchen.de/forschung/Bas/Experimente/phatt/audio/${speaker_id}/${filename}.wav`;
    }
    try {
      const response = await axios.head(url);
      if (response.status === 200) {
        res.json({ url, begin, duration });
      } else {
        res.status(404).json({ error: "Audiodatei wurde nicht gefunden" });
      }
    } catch (error) {
      res.status(500).json({ error: "Audiodatei wurde nicht gefunden" });
    }
  }
}

module.exports = PlayButton;

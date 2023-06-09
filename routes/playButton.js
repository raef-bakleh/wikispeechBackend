const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

async function PlayButton(req, res) {
  const { id, tier } = req.query;
  let query;

  if (tier == "ORT" || tier == "MAU") {
    query = `
      SELECT
        ort.id,
        ort.label AS words,
        MIN(mau.begin) / sig.samplerate::float AS begin,
        (MAX(mau.begin) + MAX(mau.duration)) / sig.samplerate::float AS duration,
        sig.speaker_id,
        sig.filename
      FROM
        signalfile sig
        JOIN segment ort ON sig.id = ort.signalfile_id
        JOIN links l ON l.lto = ort.id
        JOIN segment mau ON mau.id = l.lfrom
      WHERE
        ort.tier = 'ORT'
        AND mau.tier = 'MAU'
        ${tier == "ORT" ? `AND ort.id = ${id}` : ""}
        ${
          tier == "MAU"
            ? `
        AND ort.id = (
          SELECT ort.id
          FROM segment ort
          JOIN links l ON l.lto = ort.id
          JOIN segment mau ON mau.id = l.lfrom
          WHERE mau.id = ${id}
          LIMIT 1
        )
      `
            : ""
        }      GROUP BY
        ort.id,
        ort.label,
        sig.samplerate,
        sig.speaker_id,
        sig.filename;
    `;
  } else {
    query = `
    SELECT
    ort.id,
    ort.label AS words,
    MIN(mau.begin) / sig.samplerate::float AS begin,
    (MAX(mau.begin) + MAX(mau.duration)) / sig.samplerate::float AS duration,
    sig.speaker_id,
    sig.filename
  FROM
    signalfile sig
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
    ort.label,
    sig.samplerate,
    sig.speaker_id,
    sig.filename
    `;
  }

  const segments = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT,
    replacements: { id },
  });

  if (segments.length > 0) {
    const { speaker_id, filename, begin, duration } = segments[0];
    const url = `https://www.phonetik.uni-muenchen.de/forschung/Bas/Experimente/phatt/audio/${speaker_id}/${filename}.wav`;

    res.json({ url, begin, duration });
  } else {
    res.status(404).json({ error: "Segment not found" });
  }
}

module.exports = PlayButton;

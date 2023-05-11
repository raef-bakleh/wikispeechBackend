const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const sequelize = require("./config/database");
const wordsRouter = require("./routes/words");
const runQuery = require("./routes/query");
const allProjects = require("./routes/allProjects");
const allVocals = require("./routes/allVocals");
const geoData = require("./routes/geoData");
const getSpeakerCount = require("./routes/speakerCount");
const generatedQuery = require("./routes/dynamicQuery");
const fs = require("fs");
const app = express();
const PORT = 3001;

const corsOptions = {
  origin: ["http://localhost:3000", "https://wikispeech-frontend.vercel.app"],
};
app.get("/", (req, res) => {
  res.send("GET Request Called");
});

app.use(express.json());
app.use(cors(corsOptions));
app.get("/speakerCount", getSpeakerCount);
app.post("/query", runQuery);
app.get("/generateQuery", generatedQuery);
app.get("/words", wordsRouter);
app.get("/allProjects", allProjects);
app.get("/allVocals", allVocals);
app.get("/getAllGeoData", geoData);
// app.get("/geojson/:state", (req, res) => {
//   const state = req.params.state;
//   const filePath = `./data/${state}.json`;

//   fs.readFile(filePath, (err, data) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).send("Error reading file");
//     }
//     const geoJson = data ? JSON.parse(data) : {};
//     res.send(geoJson);
//   });
// });

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});

sequelize
  .authenticate()
  .then(() =>
    console.log("Die Verbindung zur Datenbank wurde erfolgreich hergestellt.")
  )
  .catch((error) =>
    console.error("Fehler bei der Verbindung zur Datenbank:", error)
  );

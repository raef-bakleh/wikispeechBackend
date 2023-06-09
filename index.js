const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes, QueryTypes } = require("sequelize");
const sequelize = require("./config/database");
const wordsRouter = require("./routes/words");
const runQuery = require("./routes/query");
const allProjects = require("./routes/initalData");
const allVocals = require("./routes/allVocals");
const getSpeakerCount = require("./routes/speakerCount");
const generatedQuery = require("./routes/dynamicQuery");
const allStates = require("./routes/allStates");
const geoData = require("./routes/geoData");
const actualProjects = require("./routes/allProjects");
const allWords = require("./routes/allWords");
const playButton = require("./routes/playButton");

const app = express();
const PORT = 8080;
const https = require("https");
const getInitialData = require("./routes/allStates");
const corsOptions = {
  origin: ["http://localhost:3000", "https://wikispeech-frontend.vercel.app"],
};
app.use(express.json());
app.use(cors());
app.get("/speakerCount", getSpeakerCount);
app.post("/query", runQuery);
app.get("/generateQuery", generatedQuery);
app.get("/words", wordsRouter);
app.get("/allProjects", allProjects);
app.get("/allVocals", allVocals);
app.get("/allStates", allStates);
app.get("/actualProjects", actualProjects);
app.get("/allWords", allWords);
app.get("/play", playButton);

app.get("/getAllGeoData", geoData);

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

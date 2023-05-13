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
const app = express();
const PORT = 8080;
const corsOptions = {
  origin: ["http://localhost:3000", "https://wikispeech-frontend.vercel.app"],
};
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "FFEFC56E8F45D23C62903F0C2CB5CD12.txt");

app.get(
  "/.well-known/pki-validation/FFEFC56E8F45D23C62903F0C2CB5CD12.txt",
  (req, res) => {
    res.sendFile(file);
  }
);

app.use(express.json());
app.use(cors());
app.get("/speakerCount", getSpeakerCount);
app.post("/query", runQuery);
app.get("/generateQuery", generatedQuery);
app.get("/words", wordsRouter);
app.get("/allProjects", allProjects);
app.get("/allVocals", allVocals);

// app.get(
//   "/.well-known/pki-validation/7F10D6CAC3E27531C4822C587C4B6FED.txt",
//   (req, res) => {
//     res.sendFile(
//       "/Users/admin/wikispeechBackend/7F10D6CAC3E27531C4822C587C4B6FED.txt"
//     );
//   }
// );
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

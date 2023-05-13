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
const https = require("https");
const corsOptions = {
  origin: ["http://localhost:3000", "https://wikispeech-frontend.vercel.app"],
};
const fs = require("fs");
const key = fs.readFileSync("private.key");
const cert = fs.readFileSync("certificate.crt");
const cred = {
  key,
  cert,
};
app.use(express.json());
app.use(cors());
app.get("/speakerCount", getSpeakerCount);
app.post("/query", runQuery);
app.get("/generateQuery", generatedQuery);
app.get("/words", wordsRouter);
app.get("/allProjects", allProjects);
app.get("/allVocals", allVocals);

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
const httpsServer = https.createServer(cred, app);
httpsServer.listen(8443);
sequelize
  .authenticate()
  .then(() =>
    console.log("Die Verbindung zur Datenbank wurde erfolgreich hergestellt.")
  )
  .catch((error) =>
    console.error("Fehler bei der Verbindung zur Datenbank:", error)
  );

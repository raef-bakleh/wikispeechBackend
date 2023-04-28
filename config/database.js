// ssh -L 5432:postgres:5432 raef.bakleh@ssh.phonetik.uni-muenchen.de
// psql -h localhost -U raef.bakleh speechdb
require("dotenv").config();
const { Sequelize } = require("sequelize");
const { exec } = require("child_process");

// Setup SSH tunnel to database
const sshTunnel = exec(
  `ssh -L 5432:postgres:5432 raef.bakleh@ssh.phonetik.uni-muenchen.de -N`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`SSH tunnel setup error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`SSH tunnel setup stderr: ${stderr}`);
      return;
    }
    console.log(`SSH tunnel setup stdout: ${stdout}`);
  }
);

sshTunnel.on("exit", (code) => {
  console.log(`SSH tunnel setup process exited with code ${code}`);
});

const sequelize = new Sequelize("speechdb", "raef.bakleh", "Raefbakleh12", {
  host: "localhost",
  port: 5432,
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

module.exports = sequelize;

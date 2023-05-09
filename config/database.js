// ssh -L 5432:postgres:5432 raef.bakleh@ssh.phonetik.uni-muenchen.de
// psql -h localhost -U raef.bakleh speechdb
require("dotenv").config();
const { Sequelize } = require("sequelize");
// const { exec } = require("child_process");

// const sshTunnel = exec(
//   `ssh -i wikiserver.pem -L 5432:localhost:5432 ec2-user@13.49.229.220`,
//   (error, stdout, stderr) => {
//     if (error) {
//       console.error(`SSH tunnel setup error: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.error(`SSH tunnel setup stderr: ${stderr}`);
//       return;
//     }
//     console.log(`SSH tunnel setup stdout: ${stdout}`);
//   }
// );

// sshTunnel.on("exit", (code) => {
//   console.log(`SSH tunnel setup process exited with code ${code}`);
// });

const sequelize = new Sequelize(
  "wikispeech",
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }
);

module.exports = sequelize;
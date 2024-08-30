const { Sequelize } = require("sequelize");
require("dotenv").config();
const sequelize = new Sequelize(
  {
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    dialect: process.env.POSTGRES_DIALECT,
    port: process.env.POSTGRES_PORT,
    logging: false
  }
);

module.exports = sequelize;

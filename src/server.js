const express = require("express");
const routers = require("./routers/router");

const {sequelize } = require("./models/index");
const https = require('https');
const http = require('http');
const cookieParser = require('cookie-parser');
require("dotenv").config()
const cors = require("cors")
const multer = require('multer');

const app = express()
// const corsOptions = {
//   origin: 'http://192.168.29.122', // Replace with the IP address or domain you want to allow
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify methods you want to allow
//   credentials: true, // Allow credentials
// };

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(multer().any());
app.use("/",routers)

const httpsOptions = {
    // key: fs.readFileSync('/etc/letsencrypt/live/edusaroj.com/privkey.pem'),
    // cert: fs.readFileSync('/etc/letsencrypt/live/edusaroj.com/cert.pem'),
 };
  
  
  const httpsServer = https.createServer(httpsOptions, app);
  const httpServer = http.createServer(app);
  
  // httpsServer.listen(process.env.HTTPS_PORT, () => {
  //   console.log('HTTPS server is running on port', process.env.HTTPS_PORT);
  // });
  
  httpServer.listen(process.env.HTTP_PORT, () => {
    console.log('HTTP server is running on port ', process.env.HTTP_PORT);
  });



sequelize
  // // // //.sync({ alter: true })
  .sync()
  .then(() => {
    console.log('Sequelize models synced with the database');
  })
  .catch((err) => console.log("error from Sequelize synced:", err));
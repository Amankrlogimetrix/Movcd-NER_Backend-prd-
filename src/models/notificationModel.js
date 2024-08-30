const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");

const tblNotification = sequelize.define('tblNotification', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  Notification: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  Category:{
    type:Sequelize.ENUM("Guidelines","MOM","Instructions","Progress Reports","Any Other","Physical","Financial","Market Activities","Infrastructure" ),
    allowNull:false
  },
  FileName:{
    type:Sequelize.STRING(255),
    allowNull:false
  },
  Attachments:{
    type: Sequelize.BLOB, 
    allowNull: true,
  },
  isDeleted:{
    type: Sequelize.BOOLEAN,
    defaultValue:false
  },
  CreatedBy:{
    type:Sequelize.STRING(255),
    allowNull:false,
  },
  State:{
    type:Sequelize.STRING(100),
    allowNull:true
  }
}, {
  tableName: 'tblNotification',
  timestamps: true
});

module.exports = tblNotification;
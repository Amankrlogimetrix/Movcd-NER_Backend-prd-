const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");

const tblUser = sequelize.define('tblUser',{
    id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
    },
    user_type:{
        type: Sequelize.ENUM('JS', 'SLA','DC','SP'),
        allowNull: false,
    },
    user_code:{
        type:Sequelize.STRING(112),
        allowNull:false
    },
    password:{
        type:Sequelize.STRING(1000),
        defaultValue:"password",
        allowNull:false
    },
    user_name:{
        type:Sequelize.STRING(255),
        allowNull:false
    },
    State:{
        type:Sequelize.STRING(100),
        allowNull:true
    },
    District:{
        type:Sequelize.JSONB,
        allowNull:true
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
},{
    tableName:'tblUser',
    timestamps:false
})

module.exports = tblUser
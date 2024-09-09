const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");

const tblStateCoOrdi = sequelize.define('tblStateCoOrdi',{
    id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
    },
    State:{
        type:Sequelize.STRING,  
        allowNull:false
    },
    CoOrdi:{
        type:Sequelize.JSONB,
        allowNull:false
    }
},{
    tableName:'tblStateCoOrdi',
    timestamps:true
})

module.exports = tblStateCoOrdi;
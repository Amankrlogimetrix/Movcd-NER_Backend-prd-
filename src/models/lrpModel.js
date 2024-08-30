const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");

const tblLrp = sequelize.define('tblLrp', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
    },
    Name:{
        type: Sequelize.STRING(255),
        allowNull:false
    },
    ContactNo:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    AllocatedDistrict:{
        type:Sequelize.JSONB,
        allowNull:false
    },
    PinCode:{
        type:Sequelize.STRING(50),
        allowNull:false
    },
    Address:{
        type:Sequelize.STRING(255),
        allowNull:false
    },
    Qualification:{
        type:Sequelize.STRING(255),
        allowNull:true
    }
},{
    tableName:'tblLrp',
    timestamps:true
})

module.exports = tblLrp
const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");
const tblFarmer = sequelize.define('tblFarmer', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    figId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'tblFig',
            key: 'id'
        }
    },
    FarmerCode:{
        type: Sequelize.BIGINT,
        allowNull: false
    },
    FarmerName:{
        type: Sequelize.STRING(255),
        allowNull:false
    },
    FatherName:{
        type: Sequelize.STRING(255),
        allowNull:false
    },
    AdharNo:{
        type: Sequelize.STRING(255),
        allowNull:false
    },
    Gender:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    MobileNo:{
        type: Sequelize.BIGINT,
        allowNull:false
    },
    LandArea:{
        type: Sequelize.FLOAT,
        allowNull:false
    },
    TotalArea:{
        type: Sequelize.FLOAT,
        allowNull:false
    },
    PolygonShape:{
        type:Sequelize.JSONB,
        allowNull:true
    },
    PolygonArea:{
        type: Sequelize.FLOAT,
        allowNull:true
    },
    SchemeName:{
        type: Sequelize.STRING(50),
        defaultValue:"MOVCD",
        allowNull:false
    },
    DistrictName:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    DistrictCode:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    SubDistrictName:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    SubDistrictCode:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    StateName:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    StateCode:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    VillageName:{
        type: Sequelize.STRING(500),
        allowNull:false
    },
    VillageCode:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    CasteCatName:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    Phase:{
        type: Sequelize.STRING(50),
        allowNull:true
    },
    SmartPhone: {
        type: Sequelize.STRING,
        allowNull: true
    },
}, {
    tableName:'tblFarmer',
    timestamps: true
});

module.exports = tblFarmer;
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
    // CasteCatCode:{
    //     type: Sequelize.BIGINT,
    //     allowNull:false
    // },
    MobileNo:{
        type: Sequelize.BIGINT,
        allowNull:false
    },
    // SurveyUserCode:{
    //     type: Sequelize.BIGINT,
    //     allowNull:false
    // },
    // FarmerID:{
    //     type: Sequelize.BIGINT,
    //     allowNull:true
    // },
    // FarmID:{
    //     type: Sequelize.BIGINT,
    //     defaultValue:0,
    //     allowNull:false
    // },
    // SurveyNo:{
    //     type: Sequelize.STRING(255),
    //     allowNull:false
    // },
    LandArea:{
        type: Sequelize.FLOAT,
        allowNull:false
    },
    TotalArea:{
        type: Sequelize.FLOAT,
        allowNull:false
    },
    // ActivityType:{
    //     type: Sequelize.STRING(255),
    //     allowNull:true
    // },
    // ActivitySubType:{
    //     type: Sequelize.STRING(255),
    //     allowNull:false
    // },
    // AdharSHA256:{
    //     type: Sequelize.STRING(255),
    //     allowNull:false
    // },
    PolygonShape:{
        type:Sequelize.JSONB,
        allowNull:true
    },
    // SurveyorLat:{
    //     type: Sequelize.FLOAT,
    //     allowNull:false
    // },
    // SurveyorLong:{
    //     type: Sequelize.FLOAT,
    //     allowNull:false
    // },
    PolygonArea:{
        type: Sequelize.FLOAT,
        allowNull:true
    },
    SchemeName:{
        type: Sequelize.STRING(50),
        defaultValue:"MOVCD",
        allowNull:false
    },
    // ShortName:{
    //     type: Sequelize.STRING(50),
    //     allowNull:false
    // },
    // Latitude:{
    //     type: Sequelize.FLOAT,
    //     allowNull:false
    // },
    // Longitude:{
    //     type: Sequelize.FLOAT,
    //     allowNull:false
    // },
    DistrictName:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    SubDistrictName:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    StateName:{
        type: Sequelize.STRING(50),
        allowNull:false
    },
    VillageName:{
        type: Sequelize.STRING(500),
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
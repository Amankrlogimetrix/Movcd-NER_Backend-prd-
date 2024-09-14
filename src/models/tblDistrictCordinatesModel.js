const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");

const tblStateCoOrdi = sequelize.define('tblDistrictCoOrdi',{
    id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:true
    },
    State:{
        type:Sequelize.STRING,  
        allowNull:true
    },
    stateId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'tblStateCoOrdi',
            key: 'id'
        }
    },
    District:{
        type:Sequelize.STRING,
        allowNull:true
    },
    CoOrdi:{
        type:Sequelize.JSONB,
        allowNull:true
    }
},{
    tableName:'tblDistrictCoOrdi',
    timestamps:true
})

module.exports = tblStateCoOrdi;
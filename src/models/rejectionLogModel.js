const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");


const tblRejection = sequelize.define("tblRejection",{
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull:false
    },
    fpoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
            model:'tblFpo',
            key:'id'
        }
    },
    CreatedBySP:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{
            model:'tblUser',
            key:'id'
        }
    },
    AllDetails: {
        type: Sequelize.JSONB,
        allowNull: false
    },
    RejectionReason: {
        type: Sequelize.STRING,
        allowNull: false
    },

},{
    tableName:'tblRejection',
    timestamps: true
})

module.exports = tblRejection;
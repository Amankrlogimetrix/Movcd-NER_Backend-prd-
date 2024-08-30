const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");

const tblFig = sequelize.define('tblFig', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    Name: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    BlockName:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    District:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    PinCode:{
        type: Sequelize.STRING(50),
        allowNull:true
    },
    FigLeader:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    FigLeaderContact:{
        type: Sequelize.BIGINT,
        allowNull:true
    },
    VillageName:{
        type:Sequelize.STRING(100),
        allowNull:true
    },
    fpoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'tblFpo',
            key: 'id',
        }
    },
    lrpId:{
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'tblLrp',
            key: 'id',
        }
    },
    Phase:{
        type: Sequelize.STRING(50),
        allowNull:true
    },
}, {
    tableName:'tblFig',
    timestamps: true
});

module.exports = tblFig;

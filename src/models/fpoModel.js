const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");

const tblFpo = sequelize.define('tblFpo', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    spId:{
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'tblUser',
            key: 'id',
        }
    },
    Name: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    Phase:{
        type: Sequelize.STRING(50),
        allowNull:true
    },
    RegistrationNo:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    State:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    District:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    Block:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    Pincode:{
        type: Sequelize.STRING(50),
        allowNull:true
    },
    FpoContactNo:{
        type: Sequelize.STRING(50),
        allowNull:true
    },
    EmailId:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    CeoName:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    CeoContactNo:{
        type: Sequelize.STRING(50),
        allowNull:true
    },
    AccountName:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    BoardOfDirector:{
        type: Sequelize.JSONB,
        allowNull:true
    },
    ChairManName:{
        type: Sequelize.STRING(100),
        allowNull:true
    },
    OfficeAddress:{
        type: Sequelize.STRING(255),
        allowNull:true
    },
    Status:{
        type: Sequelize.STRING(50),
        allowNull:false,
        defaultValue:"Save"
    },
    SlaApprove:{
        type: Sequelize.STRING(50),
        allowNull:false,
        defaultValue:"false"
    },
}, {
    tableName:'tblFpo',
    timestamps: true
});

module.exports = tblFpo;
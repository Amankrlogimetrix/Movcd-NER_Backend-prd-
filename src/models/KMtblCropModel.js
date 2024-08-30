const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");

const KMtblCrop = sequelize.define('KMtblCrop', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    CropName: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    farmerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'KMtblFarmer',
            key: 'id'
        }
    },
    Phase:{
        type: Sequelize.STRING(50),
        allowNull:true
    },
    SeasonName: {
      type: Sequelize.STRING,
      allowNull:true
    },
    CropGroupName: {
      type: Sequelize.STRING,
      allowNull:true
    },
    FarmerCode: {
      type: Sequelize.INTEGER,
      allowNull:true
    },
    FinYear: {
      type: Sequelize.STRING,
      allowNull:true
    },
    Yield: {
          type: Sequelize.STRING,
          allowNull:true
    },
    CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
}, {
    tableName:'KMtblCrop',
    timestamps: false
});

module.exports = KMtblCrop;
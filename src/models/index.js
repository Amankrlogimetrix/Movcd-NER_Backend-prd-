const Sequelize = require("sequelize");
const sequelize = require("../utils/dbConfig");

const tblUser = require("./userModel");
const tblFpo = require("./fpoModel");
const tblFig = require("./figModel");
const tblFarmer = require("./farmersModel");
const tblCrop = require("./cropsModel");
const tblRejection = require("./rejectionLogModel");
const KMtblFarmer= require("./KmfarmerModel");
const KMtblCrop= require("./KMtblCropModel");
const tblNotification= require("./notificationModel");
const tblLrp = require("./lrpModel");
const tblStateCoOrdi = require('./tblStateCordinates');
const tblDistrictCoOrdi = require('./tblDistrictCordinatesModel');

// Establishing relationships

tblUser.hasMany(tblFpo, { foreignKey: 'spId' });
tblFpo.belongsTo(tblUser, { foreignKey: 'spId' });

tblFpo.hasMany(tblFig, { foreignKey: 'fpoId' });
tblFig.belongsTo(tblFpo, { foreignKey: 'fpoId' });

tblFig.hasMany(tblFarmer, { foreignKey: 'figId' });
tblFarmer.belongsTo(tblFig, { foreignKey: 'figId' });

tblLrp.hasMany(tblFig, { foreignKey: 'lrpId' });
tblFig.belongsTo(tblLrp, { foreignKey: 'lrpId' });

tblFarmer.hasMany(tblCrop, { foreignKey: 'farmerId' });
tblCrop.belongsTo(tblFarmer, { foreignKey: 'farmerId' });

tblFpo.hasMany(tblRejection , {foreignKey : 'fpoId' });
tblRejection.belongsTo(tblFpo, { foreignKey: 'fpoId' })



KMtblFarmer.hasMany(KMtblCrop, { foreignKey: 'farmerId' });
KMtblCrop.belongsTo(KMtblFarmer, { foreignKey: 'farmerId' });


module.exports = {
    tblUser,
    tblFpo,
    tblFig,
    tblLrp,
    tblFarmer,
    tblCrop,
    KMtblFarmer,
    KMtblCrop,
    tblNotification,
    tblStateCoOrdi,
    tblDistrictCoOrdi,
    sequelize,
    Sequelize
};

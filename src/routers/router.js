const express = require("express");
const { userLogin, createUser, refreshTokenGeneration } = require("../controllers/userControllers");
const {collectiveData, getDrillDetails, fetchPhaseWiseState} = require("../controllers/landingController");
const { getFarmerDetails, figfpoFarmerDetails,insertDataInTable, getVillageByDistrict } = require("../controllers/farmerControllers");
const { authentication,spCheck, jsOrSLACheck, dcCheck } = require("../middleware/middleware");
const { getNotification, createNotification, updateNotification, deleteNotification, getNotificationBySLA, downloadAttachments } = require("../controllers/notificationController");
const { cropDetails, phaseWiseCropList, groupWiseCrop } = require("../controllers/cropController");
const { figCreation ,getUnlistedFigs, allFigsList } = require("../controllers/figController");
const { fpoCreation, fpoListDistrict, getAllSpList , getAllFpoStatusWise, updateStautusOfFpo, rejectFpos} = require("../controllers/fpoController");
const { LrpCreation, allLrpList } = require("../controllers/lrpController");
const { fetchStateCoOrdi } = require("../controllers/coOrdiController");


const router = express.Router()

router.get("/test-me",async(req,res)=>{
    return res.status(200).send({status:true, message:"Api works fine"})
})

// router.post("/insertKMdata",insertDataInTable);
router.post("/cropDetails",cropDetails);
router.get("/phaseWiseCrop",phaseWiseCropList);
router.get("/phaseWiseState",fetchPhaseWiseState);
router.get("/groupWiseCrop",groupWiseCrop);

// *============ public Apis ==================* //

router.post("/login",userLogin);
router.post("/landingData",collectiveData);
router.post("/fetchDetails",getDrillDetails);
// router.post("/cardData",getDrillDetails);
router.get("/fetchCoOrdinate",fetchStateCoOrdi);
router.post("/refresh",refreshTokenGeneration);

// *============ Sp related Apis ==================* //

router.post("/createFig",authentication, spCheck, figCreation);
router.post("/createLrp",authentication, spCheck, LrpCreation);
router.post("/createFpo",authentication, spCheck, fpoCreation);
router.get("/unlistedFarmers",authentication, spCheck, getFarmerDetails);
router.get("/unlistedFigs",authentication, spCheck, getUnlistedFigs);
router.get("/allfpolist",authentication, fpoListDistrict);
router.get("/allFigList",authentication, allFigsList);
router.get("/allLrpList",authentication, allLrpList);
router.get("/getVillageName", authentication, getVillageByDistrict);

// *============ DC related Apis ==================* //

router.get("/allSpList" ,authentication,  getAllSpList);
router.get("/statusWiseFpo",authentication, dcCheck, getAllFpoStatusWise);

// *============ JS related Apis ==================* //

router.get("/getNotification",getNotification);
router.post("/createNotification",authentication,jsOrSLACheck, createNotification);
router.put("/updateNotification",authentication,jsOrSLACheck, updateNotification);
router.delete("/deleteNotification",authentication,jsOrSLACheck, deleteNotification);
router.post("/createUser",authentication, createUser);
router.post("/farmerDetails",authentication, figfpoFarmerDetails);

// *============ SLA related Apis ==================* //

router.get("/getNotificationBySLA", getNotificationBySLA);
router.post("/downloadNotification/:notificationId", downloadAttachments);
router.post("/approve", authentication, updateStautusOfFpo);
router.post("/reject",authentication,rejectFpos);


router.all("/*",(req,res)=>{
    return res.status(404).send({status:false, message:"HTTP Request not found"})
})



module.exports = router
const express = require("express");
const { userLogin, createUser, refreshTokenGeneration } = require("../controllers/userControllers");
const {collectiveData, getDrillDetails, fetchPhaseWiseState} = require("../controllers/landingController");
const { getFarmerDetails, figfpoFarmerDetails,insertDataInTable, getVillageByDistrict } = require("../controllers/farmerControllers");
const { authentication,spCheck, jsOrSLACheck, dcCheck } = require("../middleware/middleware");
const { getNotification, createNotification, updateNotification, deleteNotification, getNotificationBySLA, downloadAttachments } = require("../controllers/notificationController");
const { cropDetails, phaseWiseCropList, groupWiseCrop } = require("../controllers/cropController");
const { figCreation ,getUnlistedFigs, allFigsList } = require("../controllers/figController");
const { fpoCreation, fpoListDistrict, getAllSpList , getAllFpoStatusWise, updateStautusOfFpo} = require("../controllers/fpoController");
const { LrpCreation, allLrpList } = require("../controllers/lrpController");


const router = express.Router()

router.get("/test-me",async(req,res)=>{
    return res.status(200).send({status:true, message:"Api works fine"})
})

router.post("/insertKMdata",insertDataInTable);
router.post("/cropDetails",cropDetails);
router.get("/phaseWiseCrop",phaseWiseCropList);
router.get("/phaseWiseState",fetchPhaseWiseState);
router.get("/groupWiseCrop",groupWiseCrop);

// *============ public Apis ==================* //

router.post("/login",userLogin);
router.post("/landingData",collectiveData);
router.post("/fetchDetails",getDrillDetails);
// router.post("/cardData",getDrillDetails);

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

// *============ JS related Apis ==================* //

router.get("/getNotificationBySLA", getNotificationBySLA);
router.post("/downloadNotification/:notificationId", downloadAttachments);
router.post("/approve", authentication, updateStautusOfFpo);

// const fetchGeocode = async (location) => {
//     try {
//       const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json',
//         {
//           params: {
//             address: location,
//             key: "AIzaSyB2CMFPvzwTCFaXDzjjMQ6cWOqF2ov8-5U",
//           },
//         }
//       );
//       console.log("Geocode response:", response.data); // Log the full response
//       return response.data.results[0].geometry.location;
//     } catch (error) {
//       console.error("Error fetching geocode:", error);
//       return null;
//     }
//   };


router.all("/*",(req,res)=>{
    return res.status(404).send({status:false, message:"HTTP Request not found"})
})



module.exports = router
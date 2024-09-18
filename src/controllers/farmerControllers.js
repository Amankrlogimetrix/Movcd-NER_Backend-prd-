const { Op, where } = require("sequelize");
const { sequelize, tblFarmer, tblCrop, tblFig, KMtblFarmer,KMtblCrop, tblLrp } = require("../models");
const {fetchKMData} = require("../krishimapper/krishimapper")
const cron = require('node-cron');

let getFarmerDetails = async (req, res) => {
  try {
    let { DistrictName , VillageName, SubDistrict} = req.query;

    // let whereClause = DistrictName
    //   ? {
    //       [Op.or]: [{ Phase: null }, { figId: null }],
    //       DistrictName: DistrictName,
    //     }
    //   : {
    //       [Op.or]: [{ Phase: null }, { figId: null }],
    //     };
    let whereClause = {
      [Op.or]: [{ Phase: null }, { figId: null }],
    };
  
    if (DistrictName) {
      whereClause.DistrictName = DistrictName
    }
  
    if (VillageName) {
      whereClause.VillageName = VillageName
    }
    if(SubDistrict){
      whereClause.SubDistrictName = SubDistrict 
    }

    let farmerDetails = await tblFarmer.findAll({
      where: whereClause,
      attributes: [
        "FarmerCode",
        "id",
        "FarmerName",
        "Gender",
        "MobileNo",
        "StateName",
        "DistrictName",
        "VillageName",
        "LandArea"
      ],
      order:[
        ["FarmerName", "ASC"]
      ],
      raw: true,
    });

    return res.status(200).send({
      status: true,
      message: "UnListed Farmer To fig",
      data: farmerDetails,
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: "Server Error" });
  }
};

const figfpoFarmerDetails = async (req, res) => {
  try {
    let { farmerId, fpoId, figId, DistrictName } = req.body;

    if (farmerId) {

      let individualFarmerDetails = await tblFarmer.findOne({
        where:{
          id:farmerId
        },
        raw:true
      })

      return res.status(200).send({status:true, message:"Farmer Details", data:individualFarmerDetails})


    } else {
      if (fpoId) {
        // let figDetails = await tblFig.findAll({
        //   where:{
        //     fpoId:fpoId
        //   },
        //   attributes:["id"],
        //   raw:true
        // })
        // let allFig = figDetails.map((fig)=>fig.id)
        // farmerDetails = await tblFarmer.findAll({
        //   where:{
        //     DistrictName:DistrictName,
        //     figId:allFig
        //   }
        // })

        //   const farmerDetails = await tblFarmer.findAll({
        //     [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('FarmerCode'))), 'farmerCount'],
        //     include: [{
        //         model: tblFig,
        //         where: {
        //             fpoId: fpoId
        //         },
        //         attributes: ["id"],
        //         required: true
        //     }],
        //     where: {
        //         DistrictName: DistrictName
        //     },
        //     raw:true

        // });
        // let fpoDetails = await tblFig.findAll({
        //   where:{
        //     fpoId:fpoId
        //   },
        //   raw:true
        // })

        // working downwards //
        // const figDetails = await tblFarmer.findAll({
        //   include: [
        //     {
        //       model: tblFig,
        //       where: {
        //         fpoId: fpoId,
        //       },
        //       attributes: ["id", "Name"],
        //       required: true,
        //     },
        //   ],
        //   attributes: [
        //     [
        //       sequelize.fn(
        //         "COUNT",
        //         sequelize.fn("DISTINCT", sequelize.col("tblFarmer.FarmerCode"))
        //       ),
        //       "farmerCount",
        //     ],
        //     [sequelize.fn("SUM", sequelize.literal('CAST("LandArea" AS NUMERIC)')), "landArea"],
        //   ],
        //   where: {
        //     DistrictName: DistrictName,
        //   },
        //   group: ["tblFig.id"],
        //   raw: true,
        // });
        // working upwards
        // const rawQuery = `
        // SELECT 
        //   COUNT(DISTINCT "tblFarmer"."FarmerCode") AS "farmerCount",
        //   SUM(CAST("tblFarmer"."LandArea" AS NUMERIC)) AS "landArea",
        //   SUM(COALESCE(CAST("tblCrop"."Yield" AS NUMERIC), "N/A")) AS "production",
        //   "tblFig"."id" AS "tblFig.id",
        //   "tblFig"."Name" AS "tblFig.Name"
        // FROM 
        //   "tblFarmer"
        // INNER JOIN 
        //   "tblFig" ON "tblFarmer"."figId" = "tblFig"."id"
        // LEFT JOIN 
        //   "tblCrop" ON "tblFarmer"."id" = "tblCrop"."farmerId"
        // WHERE 
        //   "tblFarmer"."DistrictName" = :DistrictName
        //   AND "tblFig"."fpoId" = :fpoId
        // GROUP BY 
        //   "tblFig"."id", "tblFig"."Name"
        // `;
        
        // const figDetails = await sequelize.query(rawQuery, {
        //   replacements: { DistrictName: DistrictName, fpoId: fpoId },
        //   type: sequelize.QueryTypes.SELECT,
        //   raw: true
        // });


      const figDetails = await tblFarmer.findAll({
        include: [
          {
            model: tblFig,
            attributes: [], 
            where: {
              fpoId: fpoId
            },
            required: true,
            include:[
              {
                model : tblLrp,
                attributes: [], 
                required: false,
              }
            ] 
          },
          {
            model: tblCrop,
            as: 'tblCrops', 
            attributes: [], 
            required: false,
          }

        ],
        attributes: [
          [sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col("tblFarmer.FarmerCode"))), "farmerCount"],
          [sequelize.fn("SUM", sequelize.literal('COALESCE(NULLIF("tblCrops"."Yield", \'\'), \'0\')::NUMERIC')), "production"],
          [sequelize.col("tblFig.id"), "tblFig.id"], 
          [sequelize.col("tblFig.Name"), "tblFig.Name"],
          [sequelize.col("tblFig.tblLrp.Name"), "lrpName"], 
          [sequelize.col("tblFig.tblLrp.ContactNo"), "lrpContactNo"] 
        ],
        where: {
          DistrictName: DistrictName,
        },
        group: ["tblFig.id", "tblFig.Name","tblFig.tblLrp.Name","tblFig.tblLrp.ContactNo"],
        raw: true,
      });

      let figId = figDetails.map((data)=> data["tblFig.id"])

      const landAreaResults = await tblFarmer.findAll({
        where: {
          DistrictName: DistrictName,
          figId: {
            [Op.in]: figId
          }
        },
        attributes: [
          [sequelize.col("figId"), "figId"],
          [sequelize.fn("SUM", sequelize.literal('CAST("LandArea" AS NUMERIC)')), "landArea"],
                
        ],
        group: ["figId"],
        raw: true
      });
      // let lrpDetails = await tblLrp.findAll({
      //   where:{
      //     id:{
      //       [Op.in]: figId
      //     }
      //   },
      //   raw:true
      // })

      const landAreaMap = landAreaResults.reduce((map, obj) => {
        map[obj.figId] = obj.landArea;
        return map;
      }, {});
      
      const updatedFigDetails = figDetails.map(detail => ({
        "tblFig.id": detail["tblFig.id"],
        "tblFig.Name": detail["tblFig.Name"],
        farmerCount: detail.farmerCount,
        landArea: landAreaMap[detail["tblFig.id"]] || "N/A", 
        production: detail.production === 0 ? "N/A" : detail.production /1000 ,
        lrpName: detail.lrpName || "N/A",
        lrpContactNo: detail.lrpContactNo || "N/A"
      }));
      
        return res
          .status(200)
          .send({ status: true, message: "fig Details", data: updatedFigDetails });
      } else if (figId) {
         let whereClause = {
            figId: figId,
          }
          if(DistrictName){
            whereClause.DistrictName = DistrictName
          }
        const farmerDetails = await tblFarmer.findAll({
          where:whereClause,
          attributes:  ["id","FarmerCode","FarmerName",[sequelize.col('LandArea'), 'landArea']] ,
          raw: true,
        });
        return res
          .status(200)
          .send({
            status: true,
            message: "Farmer List",
            data: farmerDetails,
          });
      }
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: "Server Error"});
  }
};

const insertDataInTable = async()=>{
  try {
        
        const KMdata = await fetchKMData();
        if (!KMdata || !Array.isArray(KMdata) || KMdata.length === 0) {
          console.log("Unable to fetch Data");
          return;
          
        }
        for (const farmerData of KMdata) {

          if (farmerData.stateName === "Bihar") {
            continue; 
          }
            const farmer = await tblFarmer.create({
              FarmerCode: farmerData.farmerCode,
              FarmerName: farmerData.farmerName.toUpperCase(),
              FatherName: farmerData.fatherName,
              AdharNo: farmerData.aadharNo,
              Gender: farmerData.gender,
              MobileNo: farmerData.mobileNo,
              LandArea: farmerData.landArea,
              TotalArea: farmerData.totalArea,
              PolygonShape: farmerData.farmerCropSurveyPolygonList.length > 0 ? JSON.parse(farmerData.farmerCropSurveyPolygonList[0].polygonShape) : [],
              // SurveyorLat: farmerData.farmerCropSurveyPolygonList[0].surveyorLat,
              // SurveyorLong: farmerData.farmerCropSurveyPolygonList[0].surveyorLong,
              // PolygonArea: farmerData.farmerCropSurveyPolygonList[0].polygonArea ? farmerData.farmerCropSurveyPolygonList[0].polygonArea : null,
              PolygonArea: farmerData.farmerCropSurveyPolygonList.length > 0 ? farmerData.farmerCropSurveyPolygonList[0]?.polygonArea : null,
              SchemeName: farmerData.schemeName,
              DistrictName: farmerData.districtName.toUpperCase(),
              SubDistrictName: farmerData.subDistrictName.toUpperCase(),
              StateName: farmerData.stateName.toUpperCase(),
              VillageName: farmerData.villageName.toUpperCase(),
              CasteCatName: farmerData.casteCatName,
              Phase: "Phase IV",
              SmartPhone: farmerData.SmartPhone,
              createdAt: farmerData.createdOn,
            }
          );
          // for (const cropData of farmerData.farmerCropDetailsExtsList) {
          //     cropData.farmerid = farmer.id;
          //     if(farmerData.farmerCode == cropData.farmerCode ){
          //       await KMtblCrop.create({
          //         CropName : cropData.multiCropName,
          //         farmerId: cropData.farmerid,
          //         Phase: "Phase IV",
          //         SeasonName: cropData.seasonName,
          //         CropGroupName : cropData.multiCropGroupName,
          //         FarmerCode  : cropData.farmerCode,
          //         FinYear : cropData.finYear,
          //         Yield :cropData.multiYieldName,
          //         CreatedAt : cropData.createdOn
          //       });
          //     }


          // }
          // break;

          
      // if (farmerData.multiCropGroupName && farmerData.multiCropGroupName.includes('||')) {
      //   const cropGroups = farmerData.multiCropGroupName.split('||');
      //   const cropNames = farmerData.multiCropName.split('||');

      //   for (let i = 0; i < cropGroups.length; i++) {
      //     const cropGroupName = cropGroups[i];
      //     const cropNameArray = cropNames[i].split(',');

      //     for (const cropName of cropNameArray) {
      //       await KMtblCrop.create({
      //         CropName: cropName.trim(),
      //         farmerId: farmer.id,
      //         Phase: "Phase IV",
      //         SeasonName: farmerData.seasonName,
      //         CropGroupName: cropGroupName,
      //         FarmerCode: farmerData.farmerCode,
      //         FinYear: farmerData.finYear,
      //         Yield: farmerData.multiYieldName,
      //         CreatedAt: farmerData.createdOn
      //       });
      //     }
      //   }
      // } else {
      //   const cropNameArray = farmerData.multiCropName.split(';');

      //   for (const cropName of cropNameArray) {
      //     await KMtblCrop.create({
      //       CropName: cropName.trim(),
      //       farmerId: farmer.id,
      //       Phase: "Phase IV",
      //       SeasonName: farmerData.seasonName,
      //       CropGroupName: farmerData.multiCropGroupName,
      //       FarmerCode: farmerData.farmerCode,
      //       FinYear: farmerData.finYear,
      //       Yield: farmerData.multiYieldName,
      //       CreatedAt: farmerData.createdOn
      //     });
      //   }
      // }

            for (const cropData of farmerData.farmerCropDetailsExtsList) {
              if (cropData.multiCropGroupName && cropData.multiCropGroupName.includes('||')) {
                const cropGroups = cropData.multiCropGroupName.split('||');
                const cropNames = cropData.multiCropName.split('||');
                // const yieldName = cropData.multiYieldName ? cropData.multiYieldName.split('||') : []
                    const yieldName = cropData.multiYieldName 
                ? cropData.multiYieldName.trim() !== '' 
                  ? cropData.multiYieldName.split('||').map(item => item.trim()) 
                  : [] 
                : [];
                for (let i = 0; i < cropGroups.length; i++) {
                  const cropGroupName = cropGroups[i];
                  const cropNameArray = cropNames[i].split(',');
                  // const yieldArray = yieldName[i].split(',');
                  // const yieldArray = yieldName[i] ? yieldName[i].split(',') : [];
                  let yieldArray =[]
                  if(yieldName.length>0){
                    yieldArray = yieldName[i].split(',');
                  }
                  // for (const cropName of cropNameArray) {
              for (let j = 0; j < cropNameArray.length; j++) {

                    await tblCrop.create({
                      CropName: cropNameArray[j].trim().toUpperCase(),
                      farmerId: farmer.id,
                      Phase: "Phase IV",
                      SeasonName: cropData.seasonName.toUpperCase(),
                      CropGroupName: cropGroupName.toUpperCase(),
                      FarmerCode: cropData.farmerCode,
                      FinYear: cropData.finYear,
                      Yield: yieldArray[j],
                      CreatedAt: cropData.createdOn
                    });
                  }
                }
              } else {
                const cropNameArray = cropData.multiCropName.split(',');
                // const yieldNameArray = cropData.multiYieldName.split(',');
                // const yieldNameArray = cropData.multiYieldName ? cropData.multiYieldName.split(',') : [];
                const yieldNameArray = cropData.multiYieldName 
            ? cropData.multiYieldName.trim() !== '' 
              ? cropData.multiYieldName.split(',').map(item => item.trim()) 
              : [] 
            : [];

                let index = 0
                for (const cropName of cropNameArray) {
                  await tblCrop.create({
                    CropName: cropName.trim().toUpperCase(),
                    farmerId: farmer.id, 
                    Phase: "Phase IV",
                    SeasonName: cropData.seasonName.toUpperCase(),
                    CropGroupName: cropData.multiCropGroupName.toUpperCase(),
                    FarmerCode: cropData.farmerCode,
                    FinYear: cropData.finYear,
                    Yield: yieldNameArray[index] || null, 
                    CreatedAt: cropData.createdOn
                  });
                  index++
                }

          // for (let i = 0; i < cropNameArray.length; i++) {
          //   await tblCrop.create({
          //     CropName: cropNameArray[i].trim(),
          //     farmerId: farmer.id,
          //     Phase: "Phase IV",
          //     SeasonName: cropData.seasonName,
          //     CropGroupName: cropData.multiCropGroupName,
          //     FarmerCode: cropData.farmerCode,
          //     FinYear: cropData.finYear,
          //     Yield: yieldNameArray[i] ? yieldNameArray[i].trim() : null,
          //     CreatedAt: cropData.createdOn
          //   });
          // }
              }
            }
        }

        console.log("Sucessfully inserted Faremers and Crop data from KM")
        // return res.status(200).send({message:"Sucessfully inserted alldata"})
  } catch (error) {
    console.log("error :",error)
    // return res.status(500).send({status:false, message:"Server Error",error:error.message})
  }
};

const getVillageByDistrict = async(req,res)=>{
  try {
    
    let {District} = req.decodedToken.data

    const VillageNameDetails = await tblFarmer.findAll({
      attributes: [
        'DistrictName',
        [sequelize.fn('ARRAY_AGG', sequelize.fn('DISTINCT', sequelize.col('VillageName'))), 'VillageNames'],
        [sequelize.fn('ARRAY_AGG', sequelize.fn('DISTINCT', sequelize.col('SubDistrictName'))), 'SubDistrictNames']
      ],
      where: {
        DistrictName: {
          [Op.in]: District 
        }
      },
      group: ['DistrictName'],
      raw: true
    });
    return res.status(200).send({status:true, data: VillageNameDetails})

  } catch (error) {
    return res.status(500).send({status:false, message:"Server Error", error: error.message})
  }
};

cron.schedule('0 23 * * *', async () => {
  console.log('Fetching KM data...');
  await insertDataInTable();
  console.log('Data fetched:');
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

const fetchDistrictDetailsForSLA = async(State)=>{
try {
  
    let getDetailsOfDistrict = await tblFarmer.findOne({
      where: { StateName: State },
      attributes:[
        [sequelize.literal(`ARRAY_AGG(DISTINCT "DistrictName")`), 'District']
      ],
    raw:true 
    })
    if (getDetailsOfDistrict && getDetailsOfDistrict.District) {
      return getDetailsOfDistrict.District;
  } else {
      return [];
  }
  
} catch (error) {
 console.log("Error while fetching District For SLA",error.message) 
}
}



module.exports = { getFarmerDetails, figfpoFarmerDetails, insertDataInTable ,getVillageByDistrict,fetchDistrictDetailsForSLA};
const { tblFarmer, tblFig, tblFpo, tblLrp, sequelize } = require("../models");
const { Op } = require("sequelize");
const { fetchDistrictDetailsForSLA } = require("./farmerControllers");

const figCreation = async (req, res) => {
  try {
    let {
      figId,
      FarmersId,
      Name,
      Phase,
      BlockName,
      District,
      VillageName,
      PinCode,
      FigLeader,
      FigLeaderContact,
    } = req.body;

    if (!figId) {
      let dataArr = [
        "Name",
        "Phase",
        "BlockName",
        "District",
        "PinCode",
        "FigLeader",
        "VillageName"
      ];

      for (let i = 0; i < dataArr.length; i++) {
        if (
          !req.body[dataArr[i]] ||
          req.body[dataArr[i]].toString().trim() === ""
        ) {
          return res
            .status(400)
            .send({ status: false, message: `${dataArr[i]} is required` });
        }
      }
    }
    if (figId) {
      let fpoDetails = await tblFig.findOne({
        where: { id: figId },
        include: [
          {
            model: tblFpo,
            attributes: ["SlaApprove", "Status", "Name"],
            required: false,
          },
        ],
        raw: true,
      });
      if (fpoDetails["tblFpo.SlaApprove"] === "true") {
        return res
          .status(400)
          .send({
            status: false,
            message: `${fpoDetails["tblFpo.Name"]} FPO is already approved`,
          });
      } else if (fpoDetails["tblFpo.Status"] == "Submit") {
        return res
          .status(400)
          .send({
            status: false,
            message: `${fpoDetails["tblFpo.Name"]} FPO is already submitted`,
          });
      }
      let updateFields={
        Name,
        Phase,
        BlockName,
        District,
        VillageName,
        PinCode,
        FigLeader,
        FigLeaderContact,
      }
      for (let key in updateFields) {
        if (updateFields[key] === undefined || updateFields[key] == "") {
          delete updateFields[key];
        }
      }
      
      let changesToUpdate = {};
      
      for (let key in updateFields) {
        if (updateFields[key] !== fpoDetails[key]) {
          changesToUpdate[key] = updateFields[key];
        }
      }
      
      if (Object.keys(changesToUpdate).length > 0) {
        await tblFig.update(changesToUpdate, {
          where: { id: figId },
        });
      }
    }

    if (!Array.isArray(FarmersId) || FarmersId.length === 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide FarmersId in Array" });
    }

    const farmerDataCheck = await tblFarmer.findAll({
      where: {
        id: { [Op.in]: FarmersId },
        Phase: { [Op.not]: null },
        figId: { [Op.not]: null },
      },
      attributes: ["id", "FarmerName","figId"],
      raw: true,
    });

    const farmerMappedToOtherFIG = farmerDataCheck.filter((farmer) => 
      farmer.figId != figId
    );

    if (farmerMappedToOtherFIG.length > 0) {
      const farmerNames = farmerDataCheck.map((farmer) => farmer.FarmerName);
      return res.status(400).send({
        status: false,
        message: `Farmers are already mapped: ${farmerNames.join(", ")}`,
      });
    }

    let createFig;
    if (!figId) {
      createFig = await tblFig.create({
        Name,
        Phase,
        BlockName,
        District,
        VillageName,
        PinCode,
        FigLeader,
        FigLeaderContact
      });
    }

    let farmerMappedDetails  = await tblFarmer.findAll({
      where:{
        figId:figId
      },
      raw:true
    })
    let currentMappedFarmerId = farmerMappedDetails.map((a)=> a.id) 
    const farmersToUnmap = currentMappedFarmerId.filter(id => !FarmersId.includes(id.toString()));
    
    if (farmersToUnmap.length > 0) {
      await tblFarmer.update(
        { figId: null }, 
        { where: { id: { [Op.in]: farmersToUnmap } } }
      );
    }
    await tblFarmer.update(
      {
        figId: createFig ? createFig.id : figId,
        Phase: createFig ? createFig.Phase : Phase,
      },
      { where: { id: { [Op.in]: FarmersId } } }
    );

    const responseMessage = figId
      ? "Farmers Mapped successfully"
      : "Fig Created Successfully And Farmers Mapped.";
    return res
      .status(figId ? 200 : 201)
      .send({ status: true, message: responseMessage });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error."});
  }
};

const getUnlistedFigs = async (req, res) => {
  try {
    let { District ,lrp, fpo} = req.query;
    if(!District){
      return res.status(400).send({status:false, message:"Please provide District"})
    }
    if(!lrp && !fpo){
      return res.status(400).send({status:false, message:"Please provide either lrp or fpo"})
    }
    
    if (!District) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide me District" });
    }
    District = District.split(",");

    let whereClause = {
      District: {
        [Op.in]: District,
      },
    }
    if (lrp) {
      whereClause.lrpId = null
    }else if (fpo){
      whereClause.fpoId = null
    }
    
    const figDetails = await tblFig.findAll({
      where: whereClause,
      attributes: {
        exclude: ["PinCode", "lrpId", "fpoId"],
        include: [
          [sequelize.fn('COUNT', sequelize.col('tblFarmers.id')), 'FarmerCount']
        ]
      },
      include: [
        {
          model: tblFarmer,
          attributes: [], 
          required: false 
        }
      ],
      group: ['tblFig.id'],
      order: [['Name', 'ASC']],
      raw: true,
    });
    
    return res.status(200).send({ status: true, data: figDetails });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error"});
  }
};

const allFigsList = async (req,res)=>{
  try {
    let {District,fpoId,lrpId} = req.query
    let {user_type , State} = req.decodedToken.data
    if(!District  && !fpoId && user_type != "SLA"){
      District = req.decodedToken.data.District
    }
    let whereClause = {}

    if(District){
      whereClause.District = District
    }
    if(fpoId){
      whereClause.fpoId = fpoId
    }
    if(lrpId){
      whereClause.lrpId = lrpId
    }
    if(user_type == "SLA" ){
      let districtDetails = await fetchDistrictDetailsForSLA(State)
      whereClause.District = districtDetails
    }
    
    let allFigList = await tblFig.findAll({
      where: whereClause,
      include: [
        {
          model: tblLrp,
          attributes: [],
          required: false
        },
        {
          model: tblFarmer,
          attributes: [],
          required: false,
        },
        {
          model: tblFpo,
          attributes: [],
          required: false,
        }
      ],
      attributes: [
        "id",
        "Name",
        "District", 
        "PinCode",
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("MAX", sequelize.col("tblLrp.Name")),
            'N/A'
          ),
          "lrpName",
        ],
        "BlockName",
        "FigLeader",
        "FigLeaderContact",
        "VillageName",
        [sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col("tblFarmers.id"))), "farmerCount"],
        [sequelize.fn("MAX", sequelize.col("tblFpo.Status")),"FpoStatus"],
        [sequelize.fn("MAX", sequelize.col("tblFpo.SlaApprove")),"FpoSLaApprove"],
        [
          sequelize.literal(
            `COALESCE(
              jsonb_agg(
                DISTINCT jsonb_build_object(
                  'id', "tblFarmers".id,
                  'FarmerName', "tblFarmers"."FarmerName",
                  'FarmerCode', "tblFarmers"."FarmerCode",
                  'LandArea', "tblFarmers"."LandArea"
                )
              ) FILTER (WHERE "tblFarmers".id IS NOT NULL),
              '[]'::jsonb
            )`
          ),
          "farmerDetails",
        ],
        
        
        "createdAt",
      ],
      group: ["tblFig.id"], 
      order: [['updatedAt', 'DESC']],
      raw: true
    });
    
    allFigList = allFigList.map((item) => {
      if (item.FpoStatus == "Submit" && item.FpoSLaApprove == "true") {
        item.FpoStatus = "Approved";
      } else if (item.FpoStatus == "Submit" && item.FpoSLaApprove == "false") {
        item.FpoStatus = "Pending";
      } else if (item.FpoStatus == "Save" && item.FpoSLaApprove == "false") {
        item.FpoStatus = "Processing";
      } else if (item.FpoStatus == "Reject" && item.FpoSLaApprove == "false") {
        item.FpoStatus = "Rejected";
      }else if (item.FpoStatus == null && item.FpoSLaApprove == null){
        item.FpoStatus = "Un Mapped"
      }
      delete item.FpoSLaApprove;
      return item;
    });
    
    return res.status(200).send({status:true, data:allFigList})

  } catch (error) {
    console.log(error)
    return res.status(500).send({status:false, message:"Server Error.", error:error.message})
  }
};


module.exports = { figCreation, getUnlistedFigs, allFigsList };
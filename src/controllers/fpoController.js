const { formatNumber } = require("../middleware/numberFormat");
const {
  tblFig,
  tblFpo,
  sequelize,
  tblLrp,
  tblFarmer,
  tblUser,
  tblCrop,
} = require("../models");
const { Op, where } = require("sequelize");
const { isValidNo } = require("../validation/validation");
const { fetchDistrictDetailsForSLA } = require("./farmerControllers");
const tblRejection = require("../models/rejectionLogModel");

const fpoCreation = async (req, res) => {
  try {
    let {
      figId,
      fpoId,
      Name,
      Phase,
      RegistrationNo,
      // State,
      District,
      Block,
      Pincode,
      FpoContactNo,
      EmailId,
      CeoName,
      CeoContactNo,
      AccountName,
      BoardOfDirector,
      ChairManName,
      chairman_contact_number,
      OfficeAddress,
      Status,
    } = req.body;
    let { user_id , State } = req.decodedToken.data;
    if (fpoId) {
      let fpoDetails = await tblFpo.findOne({
        where: { id: fpoId },
        raw: true,
      });

      if (fpoDetails.Status == "Submit") {
        return res.status(400).send({
          status: false,
          message: `${fpoDetails.Name} already submitted`,
        });
      }
      if (fpoDetails.SlaApprove == "true") {
        return res.status(400).send({
          status: false,
          message: `${fpoDetails.Name} already approved`,
        });
      }
      if (figId) {
        if (!Array.isArray(figId) || figId.length === 0) {
          return res
            .status(400)
            .send({ status: false, message: "Please provide figId in Array" });
        }
        let figCheckData = await tblFig.findAll({
          where: {
            id: { [Op.in]: figId },
            fpoId: { [Op.not]: null },
          },
          attributes: ["id", "Name", "fpoId"],
          raw: true,
        });
        const figsMappedToOtherFPO = figCheckData.filter(
          (fig) => fig.fpoId != fpoId
        );
        if (figsMappedToOtherFPO.length > 0) {
          let figName = figsMappedToOtherFPO.map((fig) => fig.Name);
          return res.status(400).send({
            status: false,
            message: `Fig are already mapped: ${figName.join(", ")}`,
          });
        }
      }
      if (fpoDetails.Status === "Save" || Status == "Submit" ||Status == "Save" ) {
        let updateFields = {
          Name,
          Phase,
          RegistrationNo,
          District,
          Block,
          Pincode,
          FpoContactNo,
          EmailId,
          CeoName,
          CeoContactNo,
          AccountName,
          BoardOfDirector,
          ChairManName,
          ChairManContactNo:chairman_contact_number,
          OfficeAddress,
          Status,
        };

        for (let key in updateFields) {
          if (updateFields[key] === undefined) {
            delete updateFields[key];
          }
        }

        await tblFpo.update(updateFields, {
          where: { id: fpoId },
        });

        if (figId && Array.isArray(figId)) {
          let currentFigs = await tblFig.findAll({
            where: { fpoId },
            attributes: ["id"],
            raw: true,
          });

          let currentFigIds = currentFigs.map((fig) => fig.id);

          let figsToRemove = currentFigIds.filter((id) => !figId.includes(id));

          if (figsToRemove.length > 0) {
            await tblFig.update(
              { fpoId: null },
              {
                where: { id: figsToRemove },
              }
            );
          }
          if (figId && Array.isArray(figId)) {
            await tblFig.update(
              { fpoId },
              {
                where: { id: { [Op.in]: figId } },
              }
            );
          }
        }

        return res.status(200).send({
          status: true,
          message: "FPO updated successfully",
        });
      } else {
        return res
          .status(400)
          .send({
            status: false,
            message: "FPO status does not allow updates",
          });
      }
    } else {
      let dataArr = [
        "Name",
        "Phase",
        "RegistrationNo",
        "District",
        "Block",
        "Pincode",
        "FpoContactNo",
        "EmailId",
        "CeoName",
        "CeoContactNo",
        "BoardOfDirector",
        "ChairManName",
        "chairman_contact_number",
        "OfficeAddress",
        "Status",
        "figId",
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

      if (!Array.isArray(BoardOfDirector) || BoardOfDirector.length === 0) {
        return res.status(400).send({
          status: false,
          message: "Please provide BoardOfDirector in Array",
        });
      }
      if (!Array.isArray(figId) || figId.length === 0) {
        return res.status(400).send({
          status: false,
          message: "Please provide figId in Array",
        });
      }
      if (!isValidNo(FpoContactNo)) {
        return res
          .status(400)
          .send({ status: false, message: "FpoContactNo is invalid" });
      }
      if (!isValidNo(CeoContactNo)) {
        return res
          .status(400)
          .send({ status: false, message: "CeoContactNo is invalid" });
      }
      let figCheckData = await tblFig.findAll({
        where: {
          id: { [Op.in]: figId },
          fpoId: { [Op.not]: null },
        },
        attributes: ["id", "Name"],
        raw: true,
      });
      if (figCheckData.length > 0) {
        let figName = figCheckData.map((fig) => fig.Name);
        return res.status(400).send({
          status: false,
          message: `Fig are already mapped: ${figName.join(", ")}`,
        });
      }
      let createFpo = await tblFpo.create({
        Name,
        Phase,
        RegistrationNo,
        State,
        District,
        Block,
        Pincode,
        FpoContactNo,
        EmailId,
        CeoName,
        CeoContactNo,
        AccountName,
        BoardOfDirector,
        ChairManName,
        ChairManContactNo:chairman_contact_number,
        OfficeAddress,
        Status,
        spId: user_id,
      });

      await tblFig.update(
        {
          fpoId: createFpo ? createFpo.id : fpoId,
          Phase: createFpo ? createFpo.Phase : Phase,
        },
        { where: { id: { [Op.in]: figId } } }
      );

      const responseMessage = `Fpo ${Status} Successfully`;
      return res.status(201).send({ status: true, message: responseMessage });
    }
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error.", error: error.message });
  }
};

const fpoListDistrict = async (req, res) => {
  try {
    let { District, State, user_type, user_id } = req.decodedToken.data;
    let { DistrictName, spId, status, startDate, endDate } = req.query;
    
    let whereClause = {};

    if (DistrictName || District !=null) {
      whereClause.District = DistrictName || District;
      whereClause.State = State;
    }
    if (spId) {
      whereClause.spId = spId;
    }

    if (user_type == "SP") {
      whereClause.spId = user_id;
    }

    if (user_type == "SLA" && (!status || status =="All")) {
      (whereClause.State = State),
        (whereClause.Status = {
          [Op.or]: ["Submit", "Reject"],
        });
    }
    if(user_type== "DC" && (!status || status == "All")){
      whereClause.Status = {
        [Op.or] : ["Submit","Reject"]
      }
    }
    if (status && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid date range" });
      }
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        [Op.between]: [start, end],
      };
      if (status === "Approved") {
        whereClause.Status = "Submit";
        whereClause.SlaApprove = "true";
      } else if (status === "Pending") {
        whereClause.Status = "Submit";
        whereClause.SlaApprove = "false";
      } else if (status === "Processing") {
        whereClause.Status = "Save";
        whereClause.SlaApprove = "false";
      } else if (status === "Rejected") {
        whereClause.Status = "Reject";
        whereClause.SlaApprove = "false";
      } else if (status === "All") {

      } else {
        return res
          .status(400)
          .send({ status: false, message: "Invalid status value" });
      }
      whereClause.State = State;
    }
    const fpoDetails = await tblFpo.findAll({
      attributes: [
        "id",
        "Name",
        "Status",
        "createdAt",
        "SlaApprove",
        "RegistrationNo",
        "District",
        "Block",
        "Pincode",
        "FpoContactNo",
        "EmailId",
        "CeoName",
        "CeoContactNo",
        "AccountName",
        "ChairManName",
        "ChairManContactNo",
        "OfficeAddress",
        "State",
        "BoardOfDirector",
        "updatedAt",
        [
          sequelize.literal(`
            (
              SELECT "RejectionReason"
              FROM public."tblRejection" AS r
              WHERE r."fpoId" = "tblFpo"."id" AND "tblFpo"."Status" = 'Reject'
              ORDER BY r."createdAt" DESC
              LIMIT 1
            )
          `),
          "RejectReason",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFigs.id"))
          ),
          "figCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFigs.lrpId"))
          ),
          "lrpCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFigs.tblFarmers.id"))
          ),
          "farmerCount",
        ],
        [
          sequelize.fn("SUM", sequelize.col("tblFigs->tblFarmers.LandArea")),
          "landArea",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              "COALESCE(NULLIF(\"tblFigs->tblFarmers->tblCrops\".\"Yield\", ''), '0')::NUMERIC"
            )
          ),
          "cropProduction",
        ],
        [
          sequelize.literal(`
            COALESCE(
              jsonb_agg(
                DISTINCT jsonb_build_object(
                  'id', "tblFigs"."id",
                  'FigLeader',"tblFigs"."FigLeader", 
                  'FigLeaderContact',"tblFigs"."FigLeaderContact", 
                  'Name', "tblFigs"."Name",
                  'FigBlock', "tblFigs"."BlockName",
                  'createdAt', "tblFigs"."createdAt",
                  'FarmerCount', COALESCE((
                    SELECT COUNT(*)
                    FROM public."tblFarmer" AS f
                    WHERE f."figId" = "tblFigs"."id"
                  ), 0)
                )
              ) FILTER (WHERE "tblFigs"."id" IS NOT NULL),
              '[]'::jsonb
            )
          `),
          "figDetails",
        ],
       
      ],
      include: [
        {
          model: tblFig,
          attributes: [],
          required: false,
          include: [
            {
              model: tblFarmer,
              attributes: [],
              required: false,
              include: [
                {
                  model: tblCrop,
                  attributes: [],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      where: whereClause,
      group: ["tblFpo.id"],
      order: [["updatedAt", "DESC"]],

      raw: true,
    });

    let fpoDetailAddedStatus = fpoDetails.map((item) => {
      if (item.Status == "Submit" && item.SlaApprove == "true") {
        item.Status = "Approved";
      } else if (item.Status == "Submit" && item.SlaApprove == "false") {
        item.Status = "Pending";
      } else if (item.Status == "Save" && item.SlaApprove == "false") {
        item.Status = "Processing";
      } else if (item.Status == "Reject" && item.SlaApprove == "false") {
        item.Status = "Rejected";
      }
      delete item.SlaApprove;
      return item;
    });

    let data = {};

    let totalFarmer = 0,
      figCount = 0,
      lrpCount = 0,
      landArea = 0,
      totalCropProduction = 0;

    for (let i = 0; i < fpoDetailAddedStatus.length; i++) {
      totalFarmer += +fpoDetailAddedStatus[i].farmerCount;
      figCount += +fpoDetailAddedStatus[i].figCount;
      lrpCount += +fpoDetailAddedStatus[i].lrpCount;
      landArea += +fpoDetailAddedStatus[i].landArea;
      totalCropProduction += +fpoDetailAddedStatus[i].cropProduction;
    }
    totalCropProduction = totalCropProduction / 1000;
    data.totalFarmer = await formatNumber(totalFarmer);
    data.totalFigs = await formatNumber(figCount);
    data.totalLrps = await formatNumber(lrpCount);
    data.totalLandArea = await formatNumber(landArea);
    data.totalFpos = await formatNumber(fpoDetailAddedStatus.length);
    data.totalCropProduction = await formatNumber(totalCropProduction);

    for (let i = 0; i < fpoDetailAddedStatus.length; i++) {
      let current = fpoDetailAddedStatus[i];
      current.figCount = await formatNumber(current.figCount);
      current.farmerCount = await formatNumber(current.farmerCount);
      current.landArea = await formatNumber(current.landArea);
      current.cropProduction = await formatNumber(
        current.cropProduction / 1000
      );
    }

    data.tableData = fpoDetailAddedStatus;
    return res.status(200).send({ status: true, data });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error." });
  }
};

const getAllSpList = async (req, res) => {
  try {
    let { District, user_type, State } = req.decodedToken.data;
    let { DistrictName } = req.query;
    let whereClause = {};
    if (District) {
      whereClause.District = District;
    }
    if (DistrictName) {
      whereClause.District = DistrictName;
    } else if (State && user_type == "SLA") {
      let districtDetails = await fetchDistrictDetailsForSLA(State);
      whereClause.District = districtDetails;
    }
    (whereClause.Status = {
      [Op.or]: ["Submit", "Reject"],
    });
    const spWiseDetails = await tblFpo.findAll({
      attributes: [
        "spId",
        [sequelize.col("tblUser.user_name"), "userName"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFpo.id"))
          ),
          "fpoCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFigs.id"))
          ),
          "figCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFigs.lrpId"))
          ),
          "lrpCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFigs.tblFarmers.id"))
          ),
          "farmerCount",
        ],
        [
          sequelize.fn("SUM", sequelize.col("tblFigs->tblFarmers.LandArea")),
          "landArea",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              "COALESCE(NULLIF(\"tblFigs->tblFarmers->tblCrops\".\"Yield\", ''), '0')::NUMERIC"
            )
          ),
          "cropProduction",
        ],
      ],
      include: [
        {
          model: tblFig,
          attributes: [],
          required: false,
          include: [
            {
              model: tblFarmer,
              attributes: [],
              required: false,
              include: [
                {
                  model: tblCrop,
                  attributes: [],
                  required: false,
                },
              ],
            },
          ],
        },
        {
          model: tblUser,
          attributes: [],
          required: false,
        },
      ],
      where: whereClause,
      group: ["tblFpo.spId", "userName"],
      raw: true,
    });

    spWiseDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let data = {};

    let totalFarmer = 0,
      figCount = 0,
      lrpCount = 0,
      landArea = 0,
      fpoCount = 0,
      totalCropProduction = 0;

    for (let i = 0; i < spWiseDetails.length; i++) {
      totalFarmer += +spWiseDetails[i].farmerCount;
      figCount += +spWiseDetails[i].figCount;
      lrpCount += +spWiseDetails[i].lrpCount;
      landArea += +spWiseDetails[i].landArea;
      fpoCount += +spWiseDetails[i].fpoCount;
      totalCropProduction += +spWiseDetails[i].cropProduction;
    }
    totalCropProduction = totalCropProduction / 1000;

    data.totalFpos = await formatNumber(fpoCount);
    data.totalFigs = await formatNumber(figCount);
    data.totalLrps = await formatNumber(lrpCount);
    data.totalFarmer = await formatNumber(totalFarmer);
    data.totalLandArea = await formatNumber(landArea);
    data.totalCropProduction = await formatNumber(totalCropProduction);

    for (let i = 0; i < spWiseDetails.length; i++) {
      let current = spWiseDetails[i];
      current.figCount = await formatNumber(current.figCount);
      current.farmerCount = await formatNumber(current.farmerCount);
      current.landArea = await formatNumber(current.landArea);
      current.fpoCount = await formatNumber(current.fpoCount);
      current.lrpCount = await formatNumber(current.lrpCount);
      current.cropProduction = await formatNumber(
        current.cropProduction / 1000
      );
    }
    data.tableData = spWiseDetails;

    return res.status(200).send({ status: true, data });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error" });
  }
};

const getAllFpoStatusWise = async (req, res) => {
  try {
    let { status, startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid date range" });
    }

    let whereClause = {
      createdAt: {
        [Op.between]: [start, end],
      },
    };

    if (status === "Approved") {
      whereClause.Status = "Submit";
      whereClause.SlaApprove = "true";
    } else if (status === "Pending") {
      whereClause.Status = "Submit";
      whereClause.SlaApprove = "false";
    } else if (status === "Processing") {
      whereClause.Status = "Save";
      whereClause.SlaApprove = "false";
    } else if (status === "Rejected") {
      whereClause.Status = "Reject";
      whereClause.SlaApprove = "false";
    } else if (status === "All" || !status) {
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Invalid status value" });
    }

    let fetchStatusWiseFpoDetails = await tblFpo.findAll({
      where: whereClause,

      raw: true,
    });
    let fpoDetailAddedStatus = fetchStatusWiseFpoDetails.map((item) => {
      if (item.Status == "Submit" && item.SlaApprove == "true") {
        item.Status = "Approved";
      } else if (item.Status == "Submit" && item.SlaApprove == "false") {
        item.Status = "Pending";
      } else if (item.Status == "Save" && item.SlaApprove == "false") {
        item.Status = "Processing";
      } else if (item.Status == "Reject" && item.SlaApprove == "false") {
        item.Status = "Rejected";
      }
      delete item.SlaApprove;
      return item;
    });

    return res.status(200).send({ status: true, data: fpoDetailAddedStatus });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error", error: error.message });
  }
};

const updateStautusOfFpo = async (req, res) => {
  try {
    let { fpoId } = req.body;

    let { user_type } = req.decodedToken.data;

    if (user_type !== "SLA") {
      return res
        .status(400)
        .send({ status: false, message: "You can not approve." });
    }
    if (!fpoId) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide fpoId" });
    }
    if (isNaN(fpoId)) {
      return res
        .status(400)
        .send({ status: false, message: "FpoId can only be in number" });
    }
    let approveButton = await tblFpo.findByPk(fpoId);
    if (!approveButton) {
      return res.status(404).send({ status: false, message: "Fpo Not Found" });
    }
    if (
      approveButton.status == "Submit" &&
      approveButton.SlaApprove == "true"
    ) {
      return res
        .status(200)
        .send({
          status: true,
          message: `${approveButton.Name} Is Already Approved`,
        });
    }
    if (
      approveButton.status == "Submit" &&
      approveButton.SlaApprove == "false"
    ) {
      return res
        .status(200)
        .send({ status: true, message: `${approveButton.Name} Is Rejected` });
    }
    await approveButton.update({ SlaApprove: "true" });
    return res
      .status(200)
      .send({
        status: true,
        message: `${approveButton.Name} is Approved Sucessfully`,
      });
  } catch (error) {
    return res.status(500).send({ status: false, message: "Server Error." });
  }
};

const rejectFpos = async (req, res) => {
  try {
    let { fpoId, RejectionReason } = req.body;
    let {user_type} = req.decodedToken.data

    if(!fpoId){
      return res.status(400).send({status:false, message:"Please provide fpoId"})
    }
    if(user_type != "SLA"){
      return res.status(403).send({status:false, message:"You are not authorized to reject"})
    }

    let fpoDetails = await tblFpo.findOne({
      where: {
        id: fpoId,
      },
      attributes: [
        "Name",
        "RegistrationNo",
        "State",
        "spId",
        "Status",
        "SlaApprove",
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFigs.id"))
          ),
          "figCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFigs.lrpId"))
          ),
          "lrpCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFigs.tblFarmers.id"))
          ),
          "farmerCount",
        ],
        [
          sequelize.fn("SUM", sequelize.col("tblFigs->tblFarmers.LandArea")),
          "landArea",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              "COALESCE(NULLIF(\"tblFigs->tblFarmers->tblCrops\".\"Yield\", ''), '0')::NUMERIC"
            )
          ),
          "cropProduction",
        ],
        [
          sequelize.literal(`
            COALESCE(
              jsonb_agg(
                DISTINCT jsonb_build_object(
                  'id', "tblFigs"."id",
                  'Name', "tblFigs"."Name",
                  'FigBlock', "tblFigs"."BlockName",
                  'FigLeader', "tblFigs"."FigLeader",
                  'District', "tblFigs"."District",
                  'FigLeaderContact', "tblFigs"."FigLeaderContact",
                  'FarmerDetails', COALESCE((
                    SELECT jsonb_agg(
                      jsonb_build_object(
                        'id', f."id",
                        'FarmerName', f."FarmerName",
                        'FarmerCode',f."FarmerCode",
                        'LandArea',f."LandArea",
                        'VillageName', f."VillageName",
                        'MobileNo', f."MobileNo",
                        'PolygonShape', f."PolygonShape" 
                      )
                    )
                    FROM public."tblFarmer" AS f
                    WHERE f."figId" = "tblFigs"."id"
                  ), '[]'::jsonb)
                )
              ) FILTER (WHERE "tblFigs"."id" IS NOT NULL),
              '[]'::jsonb
            )
          `),
          "figDetails",
        ],
      ],
      include: [
        {
          model: tblFig,
          attributes: [],
          required: false,
          include: [
            {
              model: tblFarmer,
              attributes: [],
              required: false,
              include: [
                {
                  model: tblCrop,
                  attributes: [],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      group: ["tblFpo.id"],
      raw: true,
    });

    if(!fpoDetails){
      return res.status(404).send({status:false, message:"Fpo Not Found"})
    }
    if(fpoDetails.Status =="Submit" && fpoDetails.SlaApprove == "true"){
      return res.status(400).send({status:false, message:`${fpoDetails.Name} is already approved`})
    }
    if(fpoDetails.Status == "Reject" && fpoDetails.SlaApprove == "false"){
      return res.status(400).send({status:false, message:`${fpoDetails.Name} is already rejected`})
    }
    await tblRejection.create({
      fpoId: fpoId,
      AllDetails: fpoDetails,
      RejectionReason: RejectionReason,
      CreatedBySP: fpoDetails.spId,
    });

    await tblFpo.update(
      { Status: "Reject" }, 
      { where: { id: fpoId } } 
    );    

    return res
      .status(200)
      .send({
        status: true,
        message: `${fpoDetails.Name} is Rejected Sucessfully.`,
      });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error." });
  }
};

module.exports = {
  fpoCreation,
  fpoListDistrict,
  getAllSpList,
  getAllFpoStatusWise,
  updateStautusOfFpo,
  rejectFpos,
};

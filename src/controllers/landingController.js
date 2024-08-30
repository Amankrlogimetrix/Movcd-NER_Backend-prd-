const { Op } = require("sequelize");
const {
  sequelize,
  tblFarmer,
  tblFig,
  tblFpo,
  tblUser,
  tblLrp,
} = require("../models");
const { formatNumber } = require("../middleware/numberFormat");
const { authentication } = require("../middleware/middleware");

const collectiveData = async (req, res) => {
  try {
    let result = await groupDetails();

    return res
      .status(200)
      .send({ status: true, message: "Sucess", data: result });
  } catch (error) {
    console.log(error);
    return res.status(500).send({status:false, message:"Server Error"})
  }
};

const groupDetails = async (phaseWise) => {
  let whereClause = {};

  if (phaseWise && phaseWise.length > 0) {
    whereClause.Phase = {
      [Op.in]: phaseWise,
    };
  }

  let farmersWithFPO = await tblFarmer.findAll({
    attributes: [
      "StateName",
      [
        sequelize.fn(
          "SUM",
          sequelize.cast(sequelize.col("LandArea"), "NUMERIC(18, 10)")
        ),
        "landArea",
      ],
      [
        sequelize.fn(
          "COUNT",
          sequelize.fn("DISTINCT", sequelize.col("DistrictName"))
        ),
        "districtCount",
      ],
      [
        sequelize.fn(
          "COUNT",
          sequelize.fn("DISTINCT", sequelize.col("FarmerCode"))
        ),
        "farmerCount",
      ],
      [
        sequelize.fn("COUNT", sequelize.fn("DISTINCT", sequelize.col("figId"))),
        "figCount",
      ],
      [
        sequelize.fn(
          "COUNT",
          sequelize.fn("DISTINCT", sequelize.col("tblFig.lrpId"))
        ),
        "lrpCount",
      ],
      [
        sequelize.literal(
          '(SELECT COUNT(DISTINCT "tblFig->tblFpo"."id") FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id" WHERE sub."StateName" = "tblFarmer"."StateName" GROUP BY sub."StateName")'
        ),
        "fpoCount",
      ],
    ],
    where: whereClause,
    include: [
      {
        model: tblFig,
        attributes: [],
        required: false,
        include: [
          {
            model: tblFpo,
            attributes: [],
            required: false,
          },
          {
            model: tblLrp,
            attributes: [],
            required: false,
          },
        ],
      },
    ],
    group: ["tblFarmer.StateName"],
    raw: true,
  });

  let totalFarmer = 0,
    totalDistrict = 0,
    landArea = 0,
    totalFigs = 0;

  for (let i = 0; i < farmersWithFPO.length; i++) {
    let current = farmersWithFPO[i];
    totalFarmer += parseInt(current.farmerCount);
    totalDistrict += parseInt(current.districtCount);
    landArea += parseInt(current.landArea);
    totalFigs += +current.figCount;
  }

  let totalFpos = await tblFpo.count();
  let totalSp = await tblUser.count({
    where: {
      user_type: "SP",
    },
    raw: true,
  });

  for (let i = 0; i < farmersWithFPO.length; i++) {
    let current = farmersWithFPO[i];
    current.landArea = await formatNumber(current.landArea);
    current.districtCount = await formatNumber(current.districtCount);
    current.farmerCount = await formatNumber(current.farmerCount);
    current.figCount = await formatNumber(current.figCount);
    current.fpoCount = await formatNumber(current.fpoCount);
  }

  let data = {};
  data.totalDistrict = totalDistrict;
  data.totalFpos = await formatNumber(totalFpos);
  data.totalFigs = await formatNumber(totalFigs);
  data.landArea = await formatNumber(landArea);
  data.totalFarmer = await formatNumber(totalFarmer);
  data.totalSp = await formatNumber(totalSp);
  data.CollectiveData = farmersWithFPO;
  return data;
};

const getDrillDetails = async (req, res) => {
  try {
    let { StateName, DistrictName, phaseWise } = req.query;

    if (!StateName && !DistrictName) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please provide StateName or DistrictName ",
        });
    }
    if (StateName === "States") {
      StateName = "All";
    }
    if (StateName && StateName == "All") {
      let result = await groupDetails(phaseWise);
      // console.log(result,"__result")
      return res.status(200).send({ status: true, data: result });
    }

    const whereClause = StateName
      ? { StateName: StateName }
      : { DistrictName: DistrictName, figId: { [Op.not]: null } };

    let groupBy = StateName
      ? ["DistrictName"]
      : ["DistrictName", "tblFig.tblFpo.Name", "tblFig.tblFpo.id"];

    if (phaseWise && phaseWise.length > 0) {
      whereClause.Phase = {
        [Op.in]: phaseWise,
      };
    }
    let attributesSet = StateName
      ? [
          "DistrictName",
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("FarmerCode"))
            ),
            "farmerCount",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("figId"))
            ),
            "figCount",
          ],
          [
            sequelize.literal(
              '(SELECT COUNT(DISTINCT "tblFig->tblFpo"."id") FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id" WHERE sub."DistrictName" = "tblFarmer"."DistrictName" GROUP BY sub."DistrictName")'
            ),
            "fpoCount",
          ],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal('CAST("LandArea" AS NUMERIC)')
            ),
            "landArea",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("tblFig.lrpId"))
            ),
            "lrpCount",
          ],
        ]
      : [
          "DistrictName",

          [sequelize.col("tblFig.tblFpo.Name"), "fpoName"],
          [sequelize.col("tblFig.tblFpo.id"), "fpoId"],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal('CAST("LandArea" AS NUMERIC)')
            ),
            "landArea",
          ],
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("tblFig.lrpId"))
            ),
            "lrpCount",
          ],
        ];

    let drilledDetails = await tblFarmer.findAll({
      where: whereClause,
      attributes: attributesSet,
      include: [
        {
          model: tblFig,
          attributes: [],
          required: false,
          include: [
            {
              model: tblFpo,
              attributes: [],
              required: false,
            },
          ],
        },
      ],
      group: groupBy,
      raw: true,
    });

    if (DistrictName) {
      let fpoIds = drilledDetails.map((a) => a.fpoId);

      let figData = await tblFig.findAll({
        where: {
          fpoId: fpoIds,
        },
        include: [
          {
            model: tblFarmer,
            where: {
              DistrictName: DistrictName,
            },
          },
        ],
        raw: true,
      });
      drilledDetails.map((item) => {
        let farmerCount = figData.filter((a) => a.fpoId == item.fpoId).length;
        if (farmerCount) {
          item.farmerCount = farmerCount;
        }

        let uniqueMatchedCount = [
          ...new Set(
            figData
              .filter(
                (a) => a.fpoId === item.fpoId && a.id === a["tblFarmers.figId"]
              )
              .map((a) => a.id)
          ),
        ].length;
        if (uniqueMatchedCount) {
          item.figCount = uniqueMatchedCount;
        }
      });
    }
    // let fpoCountInDistrict = await tblFpo.count({
    //     where: StateName? { State: StateName } : DistrictName? { District: DistrictName } : {},
    //     distinct: true,
    //     col: 'id'
    //   });

    let data = {};

    let totalFarmer = 0,
      landArea = 0,
      totalFigs = 0;

    for (let i = 0; i < drilledDetails.length; i++) {
      let current = drilledDetails[i];
      totalFarmer += +current.farmerCount;
      totalFigs += +current.figCount;
      landArea += +current.landArea;
    }

    let spwhere = {
      user_type: "SP",
    };
    if (StateName) {
      spwhere.State = StateName;
    } else if (DistrictName) {
      spwhere.District = DistrictName;
    }
    let totalSp = await tblUser.count({
      where: spwhere,
      raw: true,
    });
    let result = await tblFarmer.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("figId")), "allMappedFarmerCount"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              `CASE WHEN ${
                StateName
                  ? `"StateName" = '${StateName}'`
                  : `"DistrictName" = '${DistrictName}'`
              } THEN 1 ELSE NULL END`
            )
          ),
          "stateMappedFarmerCount",
        ],
      ],
      where: {
        [Op.not]: [{ figId: null }],
      },
      raw: true,
    });
    const fpoResult = await tblFpo.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "totalFpoCount"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              `CASE WHEN ${
                StateName
                  ? `"State" = '${StateName}'`
                  : `"District" = '${DistrictName}'`
              } THEN 1 ELSE NULL END`
            )
          ),
          "stateOrDistrictFpoCount",
        ],
      ],
      raw: true,
    });

    for (let i = 0; i < drilledDetails.length; i++) {
      let current = drilledDetails[i];
      current.landArea = await formatNumber(current.landArea);
      current.farmerCount = await formatNumber(current.farmerCount);
      current.figCount = await formatNumber(current.figCount);
      current.fpoCount = await formatNumber(current.fpoCount);
    }

    (data.totalFpos = await formatNumber(fpoResult[0].totalFpoCount)),
      (data.stateOrDistrictFpoCount = await formatNumber(
        fpoResult[0].stateOrDistrictFpoCount
      ));
    data.totalFigs = await formatNumber(totalFigs);
    data.landArea = await formatNumber(landArea);
    data.totalFarmer = await formatNumber(totalFarmer);
    data.totalSp = await formatNumber(totalSp);
    data.allMappedFarmerCount =
      result !== undefined
        ? await formatNumber(result[0].allMappedFarmerCount)
        : 0;
    data.stateMappedFarmerCount =
      result !== undefined
        ? await formatNumber(result[0].stateMappedFarmerCount)
        : 0;
    data.CollectiveData = drilledDetails;

    return res.status(200).send({ status: true, data });
  } catch (error) {
    console.log("error: ", error);
    return res
      .status(500)
      .send({ status: false, message: "Server Error.", error: error.message });
  }
};

const cardData = async (req, res) => {
  try {
    let { StateName, Phase } = req.body;

    let whereClause = {};
    if (StateName != "All") {
    }

    let fetchDetails = await tblFarmer.findOne({
      where: { StateName: StateName, Phase: Phase },
      attributes: [
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("DistrictName"))
          ),
          "districtCount",
        ],
      ],
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: "Server Error." });
  }
};

const fetchPhaseWiseState = async (req, res) => {
  try {
    let token =
      req.cookies.access_token || req.headers?.authorization?.split(" ")[1];

    if (token) {
      await new Promise((resolve, reject) => {
          authentication(req, res, (err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        });

    }
    if (token && (req.decodedToken.data.user_type == "SP" || req.decodedToken.data.user_type == "DC") ) {

      const user_details = await tblUser.findOne({
        where: { id: req.decodedToken.data.user_id },
        attributes: ["id", "State", "District"],
        raw: true,
      });
      return res.status(200).send({ status: true, data: user_details });
    } else if(token && req.decodedToken.data.user_type == "SLA"){
      let State = req.decodedToken.data.State
      let getDetailsOfPhaseWiseState = await tblFarmer.findOne({
        where: { StateName: State },
        attributes:[
          [sequelize.literal(`ARRAY_AGG(DISTINCT "DistrictName")`), 'District']
        ],
      raw:true 
      })
      let data = {
        State : State,
        District:getDetailsOfPhaseWiseState.District
      }
      return res.status(200).send({status:true, data})
    }
    else{
      const getDetailsOfPhaseWiseState = await tblFarmer.findAll({
        attributes: [
          "Phase",
          [
            sequelize.fn(
              "ARRAY_AGG",
              sequelize.literal('DISTINCT "StateName"')
            ),
            "StateName",
          ],
        ],
        where: {
          [Op.and]: [
            {
              Phase: {
                [Op.not]: null,
              },
            },
            {
              Phase: {
                [Op.ne]: "",
              },
            },
          ],
        },
        group: ["Phase"],
        raw: true,
      });

      let phase3 = {
        Phase: "Phase III",
        StateName: ["Arunachal Pradesh", "Manipur"],
      };
      getDetailsOfPhaseWiseState.unshift(phase3);
      return res
        .status(200)
        .json({ status: true, data: getDetailsOfPhaseWiseState });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ status: false, message: "Server Error.", error: error.message });
  }
};

module.exports = { collectiveData, getDrillDetails, fetchPhaseWiseState };
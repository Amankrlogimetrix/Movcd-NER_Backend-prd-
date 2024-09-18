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
    // let {phaseWise ,StateName} = req.body
    // console.log(phaseWise,"__phaseWise")
    // if(phaseWise && phaseWise.length > 0 ){
    //     return res.status(404).send({status:false,  message:"Phase Wise Data Not Found"})
    // }
    // let whereClause ={}
    // if (StateName && StateName !== "All") {
    //     whereClause.StateName = StateName;
    // }

    // const farmersWithFPO = await tblFarmer.findAll({
    //     attributes: [
    //         'StateName',
    //         // StateName,
    //         [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('DistrictName'))), 'districtCount'],
    //         [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('FarmerCode'))), 'farmerCount'],
    //         [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('figId'))), 'figCount'],
    //         [
    //             sequelize.literal('(SELECT COUNT(DISTINCT "tblFig->tblFpo"."id") FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id" WHERE sub."StateName" = "tblFarmer"."StateName" GROUP BY sub."StateName")'),
    //             'fpoCount'
    //         ],
    //     ],
    //     include: [{
    //         model: tblFig,
    //         attributes: [],
    //         required: false,
    //         include: [{
    //             model: tblFpo,
    //             attributes: [],
    //             required: false,
    //         }]
    //     }],
    //     // where:whereClause,
    //     group: ['tblFarmer.StateName'],
    //     raw: true
    // });

    // // const farmersWithFPO = await tblFarmer.findAll({
    // //     attributes: [
    // //         'StateName',
    // //         [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('DistrictName'))), 'districtCount'],
    // //         [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('figId'))), 'figCount'],
    // //         [
    // //             sequelize.literal('(SELECT "tblFpo"."name" FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id" WHERE sub."StateName" = "tblFarmer"."StateName" LIMIT 1)'),
    // //             'fpoName'
    // //         ],
    // //         [
    // //             sequelize.literal('(SELECT "tblFig"."name" FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" WHERE sub."StateName" = "tblFarmer"."StateName" LIMIT 1)'),
    // //             'figName'
    // //         ]
    // //     ],
    // //     include: [{
    // //         model: tblFig,
    // //         attributes: [], // No need to retrieve attributes from tblFig
    // //         required: false
    // //     }],
    // //     group: ['tblFarmer.StateName'],
    // //     raw: true
    // // });

    // // console.log(farmersWithFPO);

    // let totalFarmer=0

    // for(let i=0;i<farmersWithFPO.length;i++){
    //     let current = farmersWithFPO[i];
    //     totalFarmer += parseInt(current.farmerCount)
    // }

    // let totalFpos = await tblFpo.count();
    // // let totalFigs = await tblFig.count();

    // let data = {}

    // data.totalFarmer = totalFarmer
    // data.totalFpos = totalFpos
    // // data.totalFigs = totalFigs
    // data.CollectiveData = farmersWithFPO
    // console.log(" i m hitted")

    let result = await groupDetails();

    return res
      .status(200)
      .send({ status: true, message: "Sucess", data: result });
  } catch (error) {
    console.log(error);
    // return res.status(500).send({status:false, message:"Server Error"})
    return res.status(500).send({ status: false, message: error.message });
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

  // const farmersWithFPO = await tblFarmer.findAll({
  //     attributes: [
  //         'StateName',
  //         [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('DistrictName'))), 'districtCount'],
  //         [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('figId'))), 'figCount'],
  //         [
  //             sequelize.literal('(SELECT "tblFpo"."name" FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id" WHERE sub."StateName" = "tblFarmer"."StateName" LIMIT 1)'),
  //             'fpoName'
  //         ],
  //         [
  //             sequelize.literal('(SELECT "tblFig"."name" FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" WHERE sub."StateName" = "tblFarmer"."StateName" LIMIT 1)'),
  //             'figName'
  //         ]
  //     ],
  //     include: [{
  //         model: tblFig,
  //         attributes: [], // No need to retrieve attributes from tblFig
  //         required: false
  //     }],
  //     group: ['tblFarmer.StateName'],
  //     raw: true
  // });

  // console.log(farmersWithFPO);

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

  // farmersWithFPO = farmersWithFPO.forEach(async (item)=>{
  //     console.log(item,"__item")
  //     item.landArea = await formatNumber(item.landArea);
  //     return item;
  // })

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

// const groupDetails = async(phaseWise)=>{
//     let whereClause = {}
//     const phaseWiseData = {};

// if (phaseWise && phaseWise.length > 0) {
//     whereClause.Phase = {
//         [Op.in]: phaseWise
//     }
// }

// const farmersWithFPO = await tblFarmer.findAll({
//     attributes: [
//         'StateName',
//         [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('DistrictName'))), 'districtCount'],
//         [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('FarmerCode'))), 'farmerCount'],
//         [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('figId'))), 'figCount'],
//         [
//             sequelize.literal('(SELECT COUNT(DISTINCT "tblFig->tblFpo"."id") FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id" WHERE sub."StateName" = "tblFarmer"."StateName" GROUP BY sub."StateName")'),
//             'fpoCount'
//         ],
//     ],
//     where: whereClause,
//     include: [{
//         model: tblFig,
//         attributes: [],
//         required: false,
//         include: [{
//             model: tblFpo,
//             attributes: [],
//             required: false,
//         }]
//     }],
//     group: ['tblFarmer.StateName'],
//     raw: true
// });

// let totalFarmer = 0, totalDistrict = 0, totalArea = 0, totalFigs = 0;

// for (let i = 0; i < farmersWithFPO.length; i++) {
//     let current = farmersWithFPO[i];
//     totalFarmer += parseInt(current.farmerCount);
//     totalDistrict += parseInt(current.districtCount);
//     totalArea += parseInt(current.areaCount);
//     totalFigs += parseInt(current.figCount);

//     // Add phase-specific data
//     const phase = current.Phase;
//     if (!phaseWiseData[phase]) {
//         phaseWiseData[phase] = {
//             totalFarmer: 0,
//             totalDistrict: 0,
//             totalArea: 0,
//             totalFigs: 0,
//             CollectiveData: []
//         };
//     }
//     phaseWiseData[phase].totalFarmer += parseInt(current.farmerCount);
//     phaseWiseData[phase].totalDistrict += parseInt(current.districtCount);
//     phaseWiseData[phase].totalArea += parseInt(current.areaCount);
//     phaseWiseData[phase].totalFigs += parseInt(current.figCount);
//     phaseWiseData[phase].CollectiveData.push(current);
// }

// const totalFpos = await tblFpo.count();
// const totalSp = await tblUser.count({
//     where: {
//         user_type: 'SP'
//     },
//     raw: true
// });

// const data = {
//     totalDistrict: totalDistrict,
//     totalFpos: totalFpos,
//     totalFigs: totalFigs,
//     totalArea: totalArea,
//     totalFarmer: totalFarmer,
//     totalSp: totalSp,
//     phases: phaseWiseData
// };
// console.log(data)

// return data;

// }

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

    // [
    //     "DistrictName",
    //     // [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('FarmerCode'))), 'farmerCount'],
    //     [
    //         sequelize.literal(`(
    //             SELECT COUNT(DISTINCT sub."FarmerCode")
    //             FROM "tblFarmer" AS sub
    //             LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id"
    //             LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id"
    //             WHERE sub."DistrictName" = "tblFarmer"."DistrictName"
    //             AND "tblFpo"."id" IS NOT NULL
    //         )`),
    //         'farmerCount'
    //     ],
    //     [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('figId'))), 'figCount'],
    //     [
    //         sequelize.literal('(SELECT COUNT(DISTINCT "tblFig->tblFpo"."id") FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id" WHERE sub."DistrictName" = "tblFarmer"."DistrictName" GROUP BY sub."DistrictName")'),
    //         'fpoCount'
    //     ],

    //     // ------ working donwards
    //     [
    //     sequelize.literal('(SELECT "tblFpo"."Name" FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id" WHERE sub."DistrictName" = "tblFarmer"."DistrictName" LIMIT 1)'),
    //     'fpoName'
    //     ],
    //     [
    //     sequelize.literal('(SELECT "tblFpo"."id" FROM "tblFarmer" AS sub LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id" LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id" WHERE sub."DistrictName" = "tblFarmer"."DistrictName" LIMIT 1)'),
    //     'fpoId'
    //     ]
    // ]
    //         // // -------- working upwards

    //         [
    //             sequelize.literal(`(
    //               SELECT "tblFpo"."Name"
    //               FROM "tblFarmer" AS sub
    //               LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id"
    //               LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id"
    //               WHERE sub."DistrictName" = "tblFarmer"."DistrictName"
    //               AND "tblFpo"."id" IS NOT NULL
    //               LIMIT 1
    //             )`),
    //             'fpoName'
    //           ],
    //           [
    //             sequelize.literal(`(
    //               SELECT "tblFpo"."id"
    //               FROM "tblFarmer" AS sub
    //               LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id"
    //               LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id"
    //               WHERE sub."DistrictName" = "tblFarmer"."DistrictName"
    //               AND "tblFpo"."id" IS NOT NULL
    //               LIMIT 1
    //             )`),
    //             'fpoId'
    //           ]
    // ]

    // [
    //     [
    //       sequelize.literal(`(
    //         SELECT "tblFpo"."Name"
    //         FROM "tblFarmer" AS sub
    //         LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id"
    //         LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id"
    //         WHERE sub."DistrictName" = "tblFarmer"."DistrictName"
    //       )`),
    //       'fpoName'
    //     ],
    //     [
    //       sequelize.literal(`(
    //         SELECT "tblFpo"."id"
    //         FROM "tblFarmer" AS sub
    //         LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id"
    //         LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id"
    //         WHERE sub."DistrictName" = "tblFarmer"."DistrictName"
    //       )`),
    //       'fpoId'
    //     ],
    //     [
    //       sequelize.literal(`(
    //         SELECT COUNT(DISTINCT sub."FarmerCode")
    //         FROM "tblFarmer" AS sub
    //         LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id"
    //         LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id"
    //         WHERE sub."DistrictName" = "tblFarmer"."DistrictName"
    //       )`),
    //       'farmerCount'
    //     ],
    //     [
    //       sequelize.literal(`(
    //         SELECT COUNT(DISTINCT "tblFig"."id")
    //         FROM "tblFarmer" AS sub
    //         LEFT JOIN "tblFig" ON sub."figId" = "tblFig"."id"
    //         LEFT JOIN "tblFpo" ON "tblFig"."fpoId" = "tblFpo"."id"
    //         WHERE sub."DistrictName" = "tblFarmer"."DistrictName"
    //       )`),
    //       'figCount'
    //     ]
    //   ]
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
    // let getDetailsOfPhaseWiseState =await tblFarmer.findAll({
    //     attributes: [
    //         'StateName',
    //         'Phase'
    //     ],
    //     where: {
    //         [Op.and]: [
    //             {
    //                 Phase: {
    //                     [Op.not]: null
    //                 }
    //             },
    //             {
    //                 Phase: {
    //                     [Op.ne]: ''
    //                 }
    //             }
    //         ]
    //     },
    //     group: ['StateName', 'Phase']
    // });

    // let map = new Map();
    // getDetailsOfPhaseWiseState.forEach(row => {
    //     const { Phase, StateName } = row;
    //     if (map.has(Phase)) {
    //         map.get(Phase).push(StateName);
    //     } else {
    //         map.set(Phase, [StateName]);
    //     }
    // });

    // let phaseStateObject = {};
    // getDetailsOfPhaseWiseState.forEach(row => {
    //     const { Phase, StateName } = row;
    //     if (!phaseStateObject[Phase]) {
    //         phaseStateObject[Phase] = [];
    //     }
    //     phaseStateObject[Phase].push(StateName);
    // });

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
      // await new Promise((resolve, reject) => {
      //     authentication(req, res, (err) => {
      //       if (err) {
      //         return reject(err);
      //       }
      //       resolve();
      //     });
      //   });

      //   const { user_id } = req.decodedToken.data;

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
      // const getDetailsOfPhaseWiseState = await tblFarmer.findAll({
      //   attributes: [
      //     "Phase",
      
      //     [
      //       sequelize.fn(
      //         "ARRAY_AGG",
      //         sequelize.literal('DISTINCT "StateName"')
      //       ),
      //       "StateName",
      //     ],
      //     // [
      //     //   sequelize.fn(
      //     //     "jsonb_agg",
      //     //     sequelize.literal(`jsonb_build_object(
      //     //       'stateName', "StateName",
      //     //       'districts', ARRAY_AGG(DISTINCT "DistrictName")
      //     //     )`)
      //     //   ),
      //     //   "StateWiseDistrict"
      //     // ]
      //   ],
      //   where: {
      //     [Op.and]: [
      //       {
      //         Phase: {
      //           [Op.not]: null,
      //         },
      //       },
      //       {
      //         Phase: {
      //           [Op.ne]: "",
      //         },
      //       },
      //     ],
      //   },
      //   group: ["Phase"],
      //   raw: true,
      // });

      const getDetailsOfPhaseWiseState = await sequelize.query(`
        WITH StateDistricts AS (
          SELECT
            "Phase",
            "StateName",
            ARRAY_AGG(DISTINCT "DistrictName") AS districts
          FROM "tblFarmer"
          WHERE "Phase" IS NOT NULL AND "Phase" <> ''
          GROUP BY "Phase", "StateName"
        )
        SELECT
          "Phase",
          ARRAY_AGG(DISTINCT "StateName") AS "StateName",
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'Districts', districts,
              'StateName', "StateName"
            )
          ) AS StateWiseDistrict
        FROM StateDistricts
        GROUP BY "Phase"
      `, {
        type: sequelize.QueryTypes.SELECT,
        raw: true
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
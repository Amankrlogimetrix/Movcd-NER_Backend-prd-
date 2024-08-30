const { Op } = require("sequelize");
const { sequelize, tblFarmer, tblFig, tblFpo, tblCrop } = require("../models");
const { formatNumber } = require("../middleware/numberFormat");

const cropDetails = async (req, res) => {
  try {
    let { Phase, CropName, StateName, DistrictName } = req.body;

    let whereClause = {};
    if (Phase) {
      whereClause.Phase = Phase;
    }
    if (CropName) {
      whereClause.CropName = CropName;
    }
    let AttributesState = StateName ? "DistrictName" : "StateName";
    if (StateName) {
      whereClause[`$tblFarmer.StateName$`] = StateName;
    }
    if (DistrictName) {
      whereClause[`$tblFarmer.DistrictName$`] = DistrictName;
    }
    let attributesSet = [];

    if (StateName || !DistrictName) {
      attributesSet = [
        "CropName",
        // [
        //   sequelize.fn("SUM", sequelize.literal('CAST("Yield" AS NUMERIC)')),
        //   "TotalProduction",
        // ],
        // [
        //   sequelize.fn(
        //     "SUM",
        //     sequelize.literal(
        //       "COALESCE(NULLIF(\"tblFigs->tblFarmers->tblCrops\".\"Yield\", ''), '0')::NUMERIC"
        //     )
        //   ),
        //   "cropProduction",
        // ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              `COALESCE(NULLIF("Yield", ''), '0')::NUMERIC`
            )
          ),
          "TotalProduction",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFarmer.id"))
          ),
          "FarmerCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn(
              "DISTINCT",
              sequelize.col("tblFarmer.tblFig.tblFpo.State")
            )
          ),
          "fpoCount",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFarmer.DistrictName"))
          ),
          "districtCount",
        ],
        [sequelize.col(`tblFarmer.${AttributesState}`), AttributesState],
      ];
    }
    if (DistrictName) {
      attributesSet = [
        "CropName",
        // [
        //   sequelize.fn("SUM", sequelize.literal('CAST("Yield" AS NUMERIC)')),
        //   "TotalProduction",
        // ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              `COALESCE(NULLIF("Yield", ''), '0')::NUMERIC`
            )
          ),
          "TotalProduction",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFarmer.id"))
          ),
          "FarmerCount",
        ],
        [sequelize.col(`tblFarmer.${AttributesState}`), AttributesState],
        [sequelize.col("tblFarmer.tblFig.tblFpo.id"), "fpoId"],
        [sequelize.col("tblFarmer.tblFig.tblFpo.Name"), "fpoName"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("tblFarmer.tblFig.id"))
          ),
          "figCount",
        ],
      ];
    }

    // let groupBy

    //       if(StateName){
    //         groupBy = ["CropName", `tblFarmer.${AttributesState}`]
    //       }else if(!StateName && !DistrictName){
    //         groupBy = ["CropName", `tblFarmer.${AttributesState}`]
    //       }else if (DistrictName){
    //         groupBy =  [
    //           "CropName",
    //           `tblFarmer.${AttributesState}`,
    //           "tblFarmer.tblFig.tblFpo.id",
    //           "tblFarmer.tblFig.tblFpo.Name",
    //         ];
    //       }
    let groupBy =
      StateName || (!StateName && !DistrictName)
        ? ["CropName", `tblFarmer.${AttributesState}`]
        : DistrictName
        ? [
            "CropName",
            `tblFarmer.${AttributesState}`,
            "tblFarmer.tblFig.tblFpo.id",
            "tblFarmer.tblFig.tblFpo.Name",
          ]
        : [];

    let allCropDetails = await tblCrop.findAll({
      where: whereClause,
      attributes: [
        ...attributesSet,
        [sequelize.fn("SUM", sequelize.col("LandArea")), "landArea"],
      ],
      include: [
        {
          model: tblFarmer,
          attributes: [],
          include: [
            {
              model: tblFig,
              attributes: [],
              include: [
                {
                  model: tblFpo,
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
      group: groupBy,
      raw: true,
    });

    // console.log(allCropDetails,"_____allCropDetails")

    let whereClause2 = {};
    if (StateName) {
      whereClause2["$tblFarmer.StateName$"] = StateName;
    } else if (DistrictName) {
      whereClause2["$tblFarmer.DistrictName$"] = DistrictName;
    }
    let attributes2 = [
      [
        sequelize.fn(
          "COALESCE",
          sequelize.fn("SUM", sequelize.literal('CAST("Yield" AS NUMERIC)')),
          0
        ),
        "AllCropProduction",
      ],
    ];
    let totalCropProduction = await tblCrop.findOne({
      where: whereClause2,
      attributes: attributes2,
      include: [
        {
          model: tblFarmer,
          attributes: [],
        },
      ],
      raw: true,
    });

 

    // totalCropProduction = await formatNumber(
    //   totalCropProduction.AllCropProduction /1000
    // );
    
    totalCropProduction = (totalCropProduction.AllCropProduction /1000).toFixed(2)
    let selectedCropProduction = allCropDetails.reduce(
      (total, crop) => total + parseFloat(crop.TotalProduction/1000 || 0),
      0
    );
    for (let i = 0; i < allCropDetails.length; i++) {
      let current = allCropDetails[i];
      current.TotalProduction = await formatNumber(current.TotalProduction/1000);
      current.FarmerCount = await formatNumber(current.FarmerCount);
      current.fpoCount = await formatNumber(current.fpoCount);
      current.districtCount = await formatNumber(current.districtCount);
      current.landArea = await formatNumber(current.landArea);
    }
    // selectedCropProduction = await formatNumber(selectedCropProduction);
    selectedCropProduction = selectedCropProduction.toFixed(2);
    let data = {
      totalCropProduction,
      selectedCropProduction,
      allCropDetails,
    };
    return res.status(200).send({ status: true, message: "All Crops", data });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ status: false, message: "Server Error", Error: error.message });
  }
};

const phaseWiseCropList = async (req, res) => {
  try {
    const getDetailsOfPhaseWiseCrop = await tblCrop.findAll({
      attributes: [
        "Phase",
        [
          sequelize.fn("ARRAY_AGG", sequelize.literal('DISTINCT "CropName"')),
          "CropName",
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

    return res
      .status(200)
      .json({ status: true, data: getDetailsOfPhaseWiseCrop });
  } catch (error) {
    return res.status(500).send({ status: false, message: "Server Error." });
  }
};

const groupWiseCrop = async(req, res)=>{
  try {
    
    const groupedCrops = await tblCrop.findAll({
      attributes: [
        'CropGroupName',
        [sequelize.fn('ARRAY_AGG', sequelize.fn('DISTINCT', sequelize.col('CropName'))), 'CropNames']
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
      group: 'CropGroupName',
      raw: true
    });
    return res.status(200).send({status:true, data:groupedCrops})

  } catch (error) {
    return res.status(500).send({status:false, message:"Server Error"})
  }
};

module.exports = { cropDetails, phaseWiseCropList, groupWiseCrop };

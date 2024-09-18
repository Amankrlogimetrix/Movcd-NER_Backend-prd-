const { tblStateCoOrdi, tblDistrictCoOrdi } = require("../models");
const fs = require("fs");
const path = require("path");
const { Op, json } = require("sequelize");

const insertCoOrdinates = async () => {
  try {
    console.log("i m hited");
    const jsonFilePath = path.join(
      "D:/AMAN_LOGIMETRIX/new_coOrdi/MeghalayaDistricts.json"
    );
    const rawData = fs.readFileSync(jsonFilePath);
    const stateData = JSON.parse(rawData);

    for (let i = 0; i < stateData.length; i++) {
      let current = stateData[i];
      const parts = current.display_name.split(",").map((part) => part.trim());

      const state = "MEGHALAYA";
      let findState = await tblStateCoOrdi.findOne({
        where: {
          State: state,
        },
        raw: true,
      });

      // let create = await tblDistrictCoOrdi.create({
      //     District:current.name.toUpperCase(),
      //     State:findState.State,
      //     stateId: findState.id,
      //     CoOrdi: current
      // })
      console.log(parts, "_-parts");
      console.log("completed", current.name.toUpperCase());
    }
  } catch (error) {
    console.log("_error", error);
  }
};

// insertCoOrdinates()

const fetchStateCoOrdi = async (req, res) => {
  try {
    let { stateName, districtName } = req.query;

    if (stateName) {
      stateName = JSON.parse(stateName);

      if (stateName.length <= 0) {
        return res
          .status(400)
          .send({
            status: false,
            message: "Please send state data in stateName",
          });
      }
      if (
        !Array.isArray(stateName) ||
        !stateName.every((item) => typeof item === "string")
      ) {
        return res.status(400).json({
          status: false,
          message:
            "Invalid stateName parameter. It should be an array of strings.",
        });
      }
      let response;
      if (stateName.length > 1) {
        let stateCoOrdi = await tblStateCoOrdi.findAll({
          where: {
            State: {
              [Op.in]: stateName,
            },
          },
          raw: true,
        });
        response = stateCoOrdi.map((a) => a.CoOrdi);
      } else {
        let stateCoOrdi = await tblDistrictCoOrdi.findAll({
          where: {
            State: {
              [Op.in]: stateName,
            },
          },
          attributes: ["CoOrdi"],
          raw: true,
        });

        response = stateCoOrdi.map((a) => a.CoOrdi);
      }
      return res.status(200).send({ status: true, data: response });
    } else if (districtName) {
      districtName = JSON.parse(districtName);
      if (
        districtName &&
        (!Array.isArray(districtName) ||
          !districtName.every((item) => typeof item === "string"))
      ) {
        return res.status(400).json({
          status: false,
          message:
            "Invalid districtName parameter. It should be an array of strings.",
        });
      }
      let districtCoOrdi = await tblDistrictCoOrdi.findAll({
        where: {
          District: {
            [Op.in]: districtName,
          },
        },
        attributes: ["CoOrdi"],
        raw: true,
      });
      const coordinatesArray = districtCoOrdi.map((record) => record.CoOrdi);

      return res.status(200).send({ status: true, data: coordinatesArray });
    }
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error", error: error.message });
  }
};

module.exports = { fetchStateCoOrdi };

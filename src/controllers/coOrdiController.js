const { tblStateCoOrdi, tblDistrictCoOrdi } = require("../models");
const fs = require("fs");
const path = require("path");
const { authentication } = require("../middleware/middleware");
const { Op } = require("sequelize");

const insertCoOrdinates = async () => {
  try {
    console.log("i m hited");
    //D:/AMAN_LOGIMETRIX/new_coOrdi
    // const jsonFilePath = path.join("D:/AMAN_LOGIMETRIX/new_coOrdi/States.json");
    const jsonFilePath = path.join("D:/AMAN_LOGIMETRIX/new_coOrdi/ArunachalPradeshDistricts.json");
    const rawData = fs.readFileSync(jsonFilePath);
    const stateData = JSON.parse(rawData);
    // console.log(stateData,"__StateData")
    console.log(stateData.length,"__StateData")

    for (let i = 0; i < stateData.length; i++) {
      let current = stateData[i];
      const parts = current.display_name.split(',').map(part => part.trim());

// Extract the second part, which should be "Manipur"
        const state = parts[1].toUpperCase();
        // console.log(state,"__stateName")
        let findState = await tblStateCoOrdi.findOne({
            where:{
                State:state
            },
            raw:true
        })

    // let create = await tblDistrictCoOrdi.create({
    //     District:current.name.toUpperCase(),
    //     State:findState.State,
    //     stateId: findState.id,
    //     CoOrdi: current
    // })
    console.log(parts,"_-parts")
    console.log("completed", current.name.toUpperCase());
    // console.log("created sucessfully")
    }
  } catch (error) {
    // return res.status(500).send({status:false, message:"Server Error"})
    console.log("_error", error);
  }
};

// insertCoOrdinates()

const fetchStateCoOrdi = async (req, res) => {
  try {
    let { stateName, districtName } = req.query;
    if (!stateName && !districtName) {
      return res
        .status(400)
        .send({ status: false, message: "Please send stateName or districtName" });
    }
    if(stateName){

    if(stateName != "All" && stateName != "ALL"){
        let stateCoOrdi = await tblStateCoOrdi.findOne({
            where: { State: stateName },
            attributes:['CoOrdi']
        });
        
        if (!stateCoOrdi) {
            return res
            .status(404)
            .send({ status: false, message: "Co-ordinate not found" });
        }
        return res.status(200).send({ status: true, data : stateCoOrdi.CoOrdi });
    }
    else if(stateName == "All"){
        let StateCoOrdi = await tblStateCoOrdi.findAll({
            attributes:['CoOrdi'],
        })
        if(StateCoOrdi.length ==0){
            return res.status(404).send({ status: false, message: "Co-ordinate not"})
        }
        const coordinatesArray = StateCoOrdi.map(record => record.CoOrdi);
        return res.status(200).send({ status: true, data : coordinatesArray });
    }
    }else if (districtName){
        // if(districtName !== "All"){
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
           districtName = districtName.split(",") 

           let whereClause = { }
           if(districtName== 'All'){
            whereClause.District={
                [Op.in]: req.decodedToken.data.District
            }
           }else{
            whereClause.District = {
                [Op.in]:districtName
            }
           }

            let districtCoOrdi = await tblDistrictCoOrdi.findAll({
                where: whereClause,
                attributes:['CoOrdi'],
                raw:true
            })
        const coordinatesArray = districtCoOrdi.map(record => record.CoOrdi);

            return res.status(200).send({status:true, data:coordinatesArray})

        // }
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: "Server Error" ,error:error.message});
  }
};

module.exports = { fetchStateCoOrdi };

const { tblLrp, tblFig, tblFarmer, sequelize } = require("../models");
const { Op, literal } = require("sequelize");
const { isValidNo } = require("../validation/validation");
const { fetchDistrictDetailsForSLA } = require("./farmerControllers");



const LrpCreation = async (req,res)=>{
    try {
  
      let {Name, ContactNo, AllocatedDistrict, PinCode, Address,figId, Qualification  } = req.body
      
      //   till now there is no created update scnerio of LRPs
  
   
      let dataArr = ["Name","ContactNo","AllocatedDistrict","PinCode","Address","figId","Qualification"]
  
  
      for(let i=0 ;i<dataArr.length;i++){
        if(!req.body[dataArr[i]] || req.body[dataArr[i]].toString().trim() === ''){
          return res.status(400).send({status:false,message:`${dataArr[i]} is required`})
        }
      }
      Name = Name.toString().trim();
      ContactNo = ContactNo.toString().trim();
      PinCode = PinCode.toString().trim();
      Address = Address.toString().trim();
      Qualification = Qualification.toString().trim();
      if(!isValidNo(ContactNo)){
        return res.status(400).send({status:false,message:`ContactNo is invalid`})
      }
      if (!Array.isArray(AllocatedDistrict)) {
        return res.status(400).send({ status: false, message: 'AllocatedDistrict should be an array' });
      }
  
      if (!Array.isArray(figId)) {
        return res.status(400).send({ status: false, message: 'figId should be an array' });
      }
  
  
  
      let createLrp = await tblLrp.create({
        Name, ContactNo, AllocatedDistrict, PinCode, Address ,Qualification
      })
  
    //   let figCheck = await tblFig.findAll({
    //     where:{
    //         id:{
    //             [Op.in]:figId
    //         }
    //     }
    //   })
      
        await tblFig.update(
          { lrpId: createLrp.id },
          {
            where: {
              id: {
                [Op.in]: figId
              }
            }
          }
        );
    
      return res.status(200).send({ status: true, message: 'LRP created and figs mapped successfully' });
    
      
    } catch (error) {
      console.log(error)
        return res.status(500).send({status:false, message:"Server Error"})
    }
};

const allLrpList = async (req, res)=>{
  try {
    let {District} = req.query
    let { user_type, State} = req.decodedToken.data
    if(District){
      District= [District]
    }
    if(!District ){
      District = req.decodedToken.data.District
    }
    if(user_type == "SLA" && !District){
        let districtDetails = await fetchDistrictDetailsForSLA(State)
        District = districtDetails
    }
    
    const districtArray = `ARRAY[${District.map(d => `'${d}'`).join(',')}]`;
    const whereClause = sequelize.literal(`
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text("AllocatedDistrict") AS district
        WHERE district = ANY(${districtArray})
      )
    `);
    
    let lrpDetails = await tblLrp.findAll({
      where:whereClause,
      attributes:[
        "id",
        "Name",
        "ContactNo",
        "AllocatedDistrict",
        "Qualification",
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
            sequelize.fn("DISTINCT", sequelize.col("tblFigs.tblFarmers.id"))
          ),
          "farmerCount",
        ],
        "createdAt"
      ],
      include:[
          {
            model:tblFig,
            attributes:[],
            required:false,
            include:[
              {
                model:tblFarmer,
                attributes:[],
                required:false
              }
            ]
          }
      ],
      group:["tblLrp.id"],
      raw:true
    })

    return res.status(200).send({status:true, data:lrpDetails})
  } catch (error) {
    return res.status(500).send({status:false, message:"Server Error."})
  }
};


module.exports = {LrpCreation, allLrpList}
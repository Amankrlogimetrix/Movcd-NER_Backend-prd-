const {tblStateCoOrdi} = require('../models');


const fetchStateCoOrdi = async(req,res)=>{
    try {
        
        let {stateName} = req.query
        if(!stateName){
            return res.status(400).send({status:false, message:"Please send stateName"})
        }
        let stateCoOrdi = await tblStateCoOrdi.findAll({where:{State:stateName}})

        if(!stateCoOrdi){
            return res.status(404).send({status:false,message:"Co-ordinate not found"})
        }
        return res.status(200).send({status:true, data:stateCoOrdi})

    } catch (error) {
        return res.status(500).send({status:false, message:"Server Error"})
    }
}

module.exports = {fetchStateCoOrdi}
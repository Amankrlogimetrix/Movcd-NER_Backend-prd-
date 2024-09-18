const {tblUser, tblFarmer, sequelize} = require("../models");
const { isValidNo } = require("../validation/validation");
const Jwt = require("jsonwebtoken")

const userLogin = async (req, res) => {
    try {
      let { user_code, password } = req.body;
      user_code = user_code.toUpperCase()
      let userCheck = await tblUser.findOne({
        where: {
            user_code: user_code,
        },
        raw:true
      });
      if (!userCheck) {
        return res.status(404).send({
          status: false,
          message: `This user : ${user_code}, is not register.`,
        });
      }
  
      if(userCheck.password!== password){
        return res.status(400).send({status:false, message:"Incorrect Password."})
      }
  
      let data = {
        user_code: userCheck.user_code,
        user_type: userCheck.user_type,
        user_name: userCheck.user_name,
        user_id: userCheck.id,
      }
      if(userCheck.user_type == "SP" || userCheck.user_type == "DC" ){
        data.State =  userCheck.State
        data.District = userCheck.District
      }
      if(userCheck.user_type == "SLA"){

        data.State = userCheck.State
        data.District =  null
      }

      let token = Jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
          data
        },
        process.env.JWT_SECRET
      );
      let refreshToken = Jwt.sign(
        { 
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 , 
          data 
        },
        process.env.REFRESH_TOKEN_SECRET,
        // { exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }
      );
      const user_details = {
        message: `${userCheck.user_name}, Logged in Successfully.`,
        token: token,
        user_role : userCheck.user_type,
        // District : userCheck.District
      };

      // res.cookie('_l_a_t', token, { httpOnly: true, secure: req.secure });
      res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "None",
      });
      
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "None"
      });
  
      return res.status(200).send({status:true,
        data: user_details,
      });
    } catch (error) {
        console.log("Error : ",error)
      return res.status(500).send({ status: false, message: "Server Error." });
    }
};

const createUser = async (req, res)=>{
  try {
    const { user_name, user_code, password, user_type , District,State } = req.body;
    
    let arr = ["user_name","password","user_type","State"]

    for(let i=0 ; i<arr.length ; i++){
      if(!req.body[arr[i]]){
        return res.status(400).send({status:false, message: `Please provide ${arr[i]}`})
      }
    }
    
    if(user_type != "SP" && user_type != "DC" && user_type != "SLA" ){
      return res.status(400).send({status:false, message: "Invalid User Type. Please Select SP,DC,SLA"})
    }

    await tblUser.create({
        user_name,
        password,
        user_type,
        user_code,
        District,
        State
      })

    return res.status(201).send({status:true, message:`${user_type} created successfully`})

  } catch (error) {
    return res.status(500).send({status:false, message:"Server Error."})
    }
};

const refreshTokenGeneration = async (req,res)=>{
  try {
    if (req.cookies?.refresh_token) {
 
      const refreshToken = req.cookies.refresh_token;

      Jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,
          (err, refreshUser) => {
              if (err) {

                  return res.status(406).json({ message: 'Unauthorized' });
              }
              else {
                  const accessToken = Jwt.sign({ exp: Math.floor(Date.now() / 1000) + 60 * 60 *  24, data: refreshUser.data }, process.env.JWT_SECRET);
                  const refreshToken = Jwt.sign({exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, data: refreshUser.data }, process.env.REFRESH_TOKEN_SECRET);
                  const user_details = {
                    user_name: refreshUser.data.user_name,
                    token: accessToken,
                    user_role: refreshUser.data.user_type,
                  }
                  res.cookie("access_token", accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: "None",
                  });
                  
                  res.cookie("refresh_token", refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: "None"
                  });
                  return res.json({ status:true,
                    data: user_details, });
              }
          })
  } else {
      return res.status(406).json({ message: 'Unauthorized' });
  }


    
  } catch (error) {
    console.log(error)
    return res.status(500).send({status:false, message:"Server Error"})
  }
};



module.exports = {userLogin, createUser, refreshTokenGeneration}
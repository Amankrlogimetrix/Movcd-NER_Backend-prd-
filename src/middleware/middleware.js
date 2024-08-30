const jwt = require("jsonwebtoken");

const authentication = async (req, res, next) => {
  // console.log(req.cookies,"______l_a_t")
  const accessToken = req.cookies.access_token;
  // console.log(accessToken,"_accessToken")
  // if (!req.headers.authorization) {
  //   return res
  //     .status(400)
  //     .send({ status: false, message: "Token is Required"});
  // }
  // console.log(req.headers.authorization,"_authorization from here")

  let token = accessToken ||  req.headers?.authorization?.split(" ")[1];
// console.log(token,"_token")
  if (!token) {
    return res
      .status(400)
      .send({ status: false, message: "Token is Required"});
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return res.status(401).send({ status: false, message: err.message });
    } else {
      req.decodedToken = decodedToken;
      next();
    }
  });
};


// const authentication = (req, res, next) => {
//   const accessToken = req.cookies.access_token;
//   const refreshToken = req.cookies.refresh_token;

//   if (!accessToken) {
//     return res.status(401).send({ status: false, message: 'Access token is missing' });
//   }

//   jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
//     if (err && err.name === 'TokenExpiredError' && refreshToken) {

//       jwt.verify(refreshToken, process.env.JWT_SECRET, (refreshErr, refreshUser) => {
//         if (refreshErr) {
//           return res.status(403).send({ status: false, message: 'Invalid or expired refresh token' });
//         }

//         const newAccessToken = jwt.sign(
//           { data: refreshUser.data },
//           process.env.JWT_SECRET,
//           // { expiresIn: Math.floor(Date.now() / 1000) + 60 * 60 * 24 } 
//           { expiresIn: '2m' } 
//         );

//         res.cookie("access_token", newAccessToken, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === 'production',
//           sameSite: "None"
//         });

//         req.decodedToken = refreshUser;
//         console.log(req.decodedToken,"_decodedToken form refresh token")
//         next();
//       });
//     } else if (err) {
//       return res.status(403).send({ status: false, message: 'Invalid access token' });
//     } else {
//       // Access token is valid
//       req.decodedToken = user;
//       console.log(req.decodedToken,"__decodedToken")
//       next();
//     }
//   });
// };


const spCheck  = async(req,res,next) =>{
  
  const {user_type} = req.decodedToken.data

  if(user_type == "SP"){
    next()   
  }else{
    return res.status(403).send({status:false, message:"You Are Not Authorised"})
  }

}


const jsOrSLACheck  = async(req,res,next) =>{
  
  const {user_type} = req.decodedToken.data

  if(user_type == "JS" || user_type == "SLA"){
    next()   
  }else{
    return res.status(403).send({status:false, message:"You Are Not Authorised"})
  }

}

const dcCheck  = async(req,res,next) =>{
  
  const {user_type} = req.decodedToken.data

  if(user_type == "DC"){
    next()   
  }else{
    return res.status(403).send({status:false, message:"You Are Not Authorised"})
  }

}

const authorization = async(req,res,next)=>{
  try {
    
    
  } catch (error) {
    console.log("Error while authorization",error.message)
  }
}
module.exports = {authentication, spCheck, jsOrSLACheck, dcCheck}

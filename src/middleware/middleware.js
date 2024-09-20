const jwt = require("jsonwebtoken");

const authentication = async (req, res, next) => {
  const accessToken = req.cookies.access_token;

  let token = accessToken ||  req.headers?.authorization?.split(" ")[1];
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

module.exports = {authentication, spCheck, jsOrSLACheck, dcCheck}

const axios = require('axios');

const fetchKMData = async () => {
  const url = 'https://krishimapper.dac.gov.in/appdevapi/api/Nature/FarmerDetails/GetMovcdDataDateWise';
  const data = {
    // startDate: '2020-06-01',
    // endDate: '2024-07-05'
      startDate: '2024-08-09',
      endDate: '2024-09-01'

    //while scheduling cron we will use this for last 24 hrs,

    // startDate: new Date().toISOString().split('T')[0],
    // endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // console.log(response.data);
    // console.log((response.data.dataContent[0]),"Farmer count");

    // for(let i=0 ;i<a ;i++){
    //   console.log("farmer crop")
    //   console.log(response.data.dataContent[i].farmerCropDetailsExtsList)
    // }
    // return res.status(200).send({status:true, data:response.data.dataContent[0]})
    return  response.data.dataContent 
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};




module.exports = {fetchKMData}
const axios = require('axios');
const { tblFarmer } = require('../models');
const { fn, col } = require('sequelize');

const fetchKMData = async () => {
  const url = 'https://krishimapper.dac.gov.in/appdevapi/api/Nature/FarmerDetails/GetMovcdDataDateWise';
  const data = {
      startDate: '',
      endDate: ''
  };

  const latestDocument = await tblFarmer.findOne({
    attributes: [
      [fn('DATE', col('createdAt')), 'createdDate']  
    ],
    order: [['createdAt', 'DESC']], 
    raw:true
  });
  if (latestDocument && latestDocument.createdDate) {
    let createdDate = new Date(latestDocument.createdDate); 
    createdDate.setDate(createdDate.getDate() + 1); 
    data.startDate = createdDate.toISOString().split('T')[0]; 
    let dateToFetch = new Date()
    dateToFetch.setDate(dateToFetch.getDate() + 1)
    //i have added + 1 day to fecth the current date data because from KM we are getting farmer data for previous day.
    data.endDate = dateToFetch.toISOString().split('T')[0]
  }
  if (!data.startDate || !data.endDate) {
    console.log("Start date or end date is missing. Cannot fetch data.");
    return;
  }
  
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return  response.data.dataContent 
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};



module.exports = {fetchKMData}
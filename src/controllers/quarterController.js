const { tblUser, ActivityRecord, Quarter } = require('../models');
const jwt = require("jsonwebtoken");
const pool = require('../utils/db');

// Controller function for fetching quarter data
const viewQuarter = async (req, res) => {
    try {
        
  
        let year = req.body.year;
      
        if (year === "2023-2024") {
          year = "1";
        } else if (year === "2024-2025") {
          year = "2";
        } else if (year === "2025-2026") {
          year = "3";
        }
      
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
      
        if (!token) {
          return res.status(401).send("Access Denied: No Token Provided!");
        }
      
        // Step 2: Verify the token
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
          if (err) {
            return res.status(403).send("Invalid Token");
          }
      
          const user_code = user.data.user_code;
          const user_role = user.data.user_type; // Corrected to use 'user_type'
          console.log(user_role);
      
          // Step 3: Fetch user information
          let userQuery = `SELECT * FROM "tblUser" WHERE user_code ='${user_code}'`;
          
          pool.query(userQuery, (err, userResult) => {
            if (err) {
              console.error(err);
              return res.status(500).send("Error fetching user data.");
            } else {
              // Parse the District from the userResult
              let userDistrictArray =(userResult.rows[0].District || '[]');
              console.log(userResult.rows[0])
              let userDistrict = userDistrictArray.length > 0 ? userDistrictArray[0] : null; // Get the first district
             let userState= userResult.rows[0].State
              if (user_role === 'DC' && userDistrict) {  // Ensure userDistrict is not null
                // Fetch activity data for the DC role
                let dcQuery = `
                  SELECT ar.*, u.user_name AS sp_name
                  FROM activity_record ar
                  JOIN "tblUser" u ON ar.sp_id = u.user_code
                  WHERE ar.sp_district = '${userDistrict}' AND ar.year = ${year}`;
             
                  pool.query(dcQuery, async (err, activityResult) => {
                    if (err) {
                      console.error(err);
                      return res.status(500).send("Error fetching activity data.");
                    } else if (activityResult.rows.length === 0) {
                      // No activities found for the user, return an empty array
                      return res.json([]);
                    } else {
                      let responsesSet = new Set(); // Use Set to ensure uniqueness
        
                      // Avoid duplicate queries by using a map to store already fetched data
                      const fetchedQuarters = new Map();
        
                      // Use Promise.all to handle multiple asynchronous queries
                      const queries = activityResult.rows.map((arRes) => {
                        return new Promise((resolve, reject) => {
                          if (typeof arRes.activity_status === 'string' && arRes.activity_status.trim() !== '') {
                            // Check if the quarter data has already been fetched
                            const cacheKey = `${year}-${arRes.quarter_id}`;
                            if (fetchedQuarters.has(cacheKey)) {
                              // Use the cached data
                              const cachedRows = fetchedQuarters.get(cacheKey);
                              cachedRows.forEach((row) => responsesSet.add(JSON.stringify(row)));
                              resolve();
                            } else {
                              // Fetch data from the database
                              let query = `
                                SELECT quarter_name, created_on, year, quarter_status AS status, remarks_by_dlmc AS remarks, requisition_amnt AS requisition_amount, 
                                requisition_date, approval_amnt AS approved_amount
                                FROM quarter WHERE year = ${year} AND quarter_id = '${arRes.quarter_id}' ORDER BY year ASC`;
                              
                              pool.query(query, (err, result) => {
                                if (err) {
                                  console.error(err);
                                  reject(err);
                                } else {
                                  if (result.rows.length > 0) {
                                    fetchedQuarters.set(cacheKey, result.rows); // Cache the result
        
                                    result.rows.forEach((row) => {
                                      let response = {
                                        "sp_name":arRes.sp_name,
                                        "Quarter": row.quarter_name,
                                        "Created On": formatDate(row.created_on),
                                        "Year": convertYear(row.year),
                                        "Requisition Amount": row.requisition_amount,
                                        "Requisition Date": formatDate(row.requisition_date),
                                        "Approved Amount": row.approved_amount,
                                        "Status": row.status,
                                        "Remarks by DLMC": row.remarks,
                                      };
                                      responsesSet.add(JSON.stringify(response));
                                    });
                                  }
                                  resolve();
                                }
                              });
                            }
                          } else {
                            resolve(); // Resolve if status is invalid or empty
                          }
                        });
                      });
        
                      // Wait for all queries to complete
                      await Promise.all(queries);
        
                      // Convert the Set back to an array and parse the JSON strings
                      const responses = Array.from(responsesSet).map(JSON.parse);
        
                      // If no valid activities were found, fetch default quarter data
                      if (responses.length === 0) {
                        let defaultQuery = `
                          SELECT quarter_name, created_on, year, quarter_status AS status, remarks_by_dlmc AS remarks, requisition_amnt AS requisition_amount, 
                          requisition_date, approval_amnt AS approved_amount 
                          FROM quarter WHERE year = ${year} ORDER BY year ASC`;
        
                        pool.query(defaultQuery, (err, result) => {
                          if (err) {
                            console.error(err);
                            return res.status(500).send("Error fetching default quarter data.");
                          } else {
                            const updatedRows = formatQuarterResponse(result.rows);
                            res.json(updatedRows);
                          }
                        });
                      } else {
                        // Send the collected unique responses
                        res.json(responses);
                      }
                    }
                  });
              }
              else if (user_role === 'SLA' && userState) {
                // Fetch activity data for the SLA role based on the user's State
                let slaQuery = `
                  SELECT ar.*, u.user_name AS sp_name
                  FROM activity_record ar
                  JOIN "tblUser" u ON ar.sp_id = u.user_code
                  WHERE ar.State = '${userState}' AND ar.year = ${year}`;
                
                pool.query(slaQuery, async (err, activityResult) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).send("Error fetching SLA activity data.");
                  } else if (activityResult.rows.length === 0) {
                    return res.json([]);
                  } else {
                    let responsesSet = new Set();
                    const fetchedQuarters = new Map();
      
                    const queries = activityResult.rows.map((arRes) => {
                      return new Promise((resolve, reject) => {
                        if (typeof arRes.activity_status === 'string' && arRes.activity_status.trim() !== '') {
                          const cacheKey = `${year}-${arRes.quarter_id}`;
                          if (fetchedQuarters.has(cacheKey)) {
                            const cachedRows = fetchedQuarters.get(cacheKey);
                            cachedRows.forEach((row) => responsesSet.add(JSON.stringify(row)));
                            resolve();
                          } else {
                            let query = `
                              SELECT quarter_name, created_on, year, quarter_status AS status, remarks_by_dlmc AS remarks, requisition_amnt AS requisition_amount, 
                              requisition_date, approval_amnt AS approved_amount
                              FROM quarter WHERE year = ${year} AND quarter_id = '${arRes.quarter_id}' ORDER BY year ASC`;
                            
                            pool.query(query, (err, result) => {
                              if (err) {
                                console.error(err);
                                reject(err);
                              } else {
                                if (result.rows.length > 0) {
                                  fetchedQuarters.set(cacheKey, result.rows);
                                  result.rows.forEach((row) => {
                                    let response = {
                                      "sp_name": arRes.sp_name,
                                      "Quarter": row.quarter_name,
                                      "Created On": formatDate(row.created_on),
                                      "Year": convertYear(row.year),
                                      "Requisition Amount": row.requisition_amount,
                                      "Requisition Date": formatDate(row.requisition_date),
                                      "Approved Amount": row.approved_amount,
                                      "Status": row.status,
                                      "Remarks by DLMC": row.remarks,
                                    };
                                    responsesSet.add(JSON.stringify(response));
                                  });
                                }
                                resolve();
                              }
                            });
                          }
                        } else {
                          resolve();
                        }
                      });
                    });
      
                    await Promise.all(queries);
                    const responses = Array.from(responsesSet).map(JSON.parse);
      
                    if (responses.length === 0) {
                      let defaultQuery = `
                        SELECT quarter_name, created_on, year, quarter_status AS status, remarks_by_dlmc AS remarks, requisition_amnt AS requisition_amount, 
                        requisition_date, approval_amnt AS approved_amount 
                        FROM quarter WHERE year = ${year} ORDER BY year ASC`;
      
                      pool.query(defaultQuery, (err, result) => {
                        if (err) {
                          console.error(err);
                          return res.status(500).send("Error fetching default quarter data.");
                        } else {
                          const updatedRows = formatQuarterResponse(result.rows);
                          res.json(updatedRows);
                        }
                      });
                    } else {
                      res.json(responses);
                    }
                  }
                });
              }
              else {
                // Step 4: Fetch activities for the SP user
                let activityQuery = `SELECT * FROM activity_record WHERE sp_id='${user_code}'`;
                pool.query(activityQuery, async (err, activityResult) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).send("Error fetching activity data.");
                  } else if (activityResult.rows.length === 0) {
                    console.log('253')
                    // No activities found for the user, return an empty array
                    return res.json([]);
                  } else {
                    let responsesSet = new Set(); // Use Set to ensure uniqueness
      
                    // Avoid duplicate queries by using a map to store already fetched data
                    const fetchedQuarters = new Map();
      
                    // Use Promise.all to handle multiple asynchronous queries
                    const queries = activityResult.rows.map((arRes) => {
                      return new Promise((resolve, reject) => {
                        if (typeof arRes.activity_status === 'string' && arRes.activity_status.trim() !== '') {
                          // Check if the quarter data has already been fetched
                          const cacheKey = `${year}-${arRes.quarter_id}`;
                          if (fetchedQuarters.has(cacheKey)) {
                            // Use the cached data
                            const cachedRows = fetchedQuarters.get(cacheKey);
                            cachedRows.forEach((row) => responsesSet.add(JSON.stringify(row)));
                            resolve();
                          } else {
                            // Fetch data from the database
                            let query = `
                              SELECT quarter_name, created_on, year, quarter_status AS status, remarks_by_dlmc AS remarks, requisition_amnt AS requisition_amount, 
                              requisition_date, approval_amnt AS approved_amount
                              FROM quarter WHERE year = ${year} AND quarter_id = '${arRes.quarter_id}' ORDER BY year ASC`;
                            // console.log(arRes,'======282')
                            pool.query(query, (err, result) => {
                              if (err) {
                                console.error(err);
                                reject(err);
                              } else {
                                if (result.rows.length > 0) {
                                  fetchedQuarters.set(cacheKey, result.rows); // Cache the result
      
                                  result.rows.forEach((row) => {
                                    let response = {
                                      "Quarter": row.quarter_name,
                                      "Created On": formatDate(row.created_on),
                                      "Year": convertYear(row.year),
                                      "Requisition Amount": row.requisition_amount,
                                      "Requisition Date": formatDate(row.requisition_date),
                                      "Approved Amount": row.approved_amount,
                                      "Status": row.status,
                                      "Remarks by DLMC": row.remarks,
                                    };
                                    responsesSet.add(JSON.stringify(response));
                                  });
                                }
                                resolve();
                              }
                            });
                          }
                        } else {
                          resolve(); // Resolve if status is invalid or empty
                        }
                      });
                    });
      
                    // Wait for all queries to complete
                    await Promise.all(queries);
      
                    // Convert the Set back to an array and parse the JSON strings
                    const responses = Array.from(responsesSet).map(JSON.parse);
      
                    // If no valid activities were found, fetch default quarter data
                    if (responses.length === 0) {
                      let defaultQuery = `
                        SELECT quarter_name, created_on, year, dlmc_status AS status, remarks_by_dlmc AS remarks, requisition_amnt AS requisition_amount, 
                        requisition_date, approval_amnt AS approved_amount 
                        FROM quarter WHERE year = ${year} ORDER BY year ASC`;
      
                      pool.query(defaultQuery, (err, result) => {
                        if (err) {
                          console.error(err);
                          return res.status(500).send("Error fetching default quarter data.");
                        } else {
                          const updatedRows = formatQuarterResponse(result.rows);
                          res.json(updatedRows);
                        }
                      });
                    } else {
                      // Send the collected unique responses
                      res.json(responses);
                    }
                  }
                });
              }
            }
          });
        });
    } catch (error) {
        console.log(error)
        return res.status(500).send("Server Error")
    }
    
};

function formatDate(date) {
  if (!date) return null;
  const formattedDate = new Date(date);
  const day = String(formattedDate.getDate()).padStart(2, '0');
  const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
  const year = formattedDate.getFullYear();
  return `${day}-${month}-${year}`;
}

function convertYear(year) {
  if (year == 1) return "2023-2024";
  if (year == 2) return "2024-2025";
  if (year == 3) return "2025-2026";
  return year;
}

module.exports = {
    viewQuarter
};

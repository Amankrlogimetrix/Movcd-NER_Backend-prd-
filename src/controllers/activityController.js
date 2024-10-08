const pool = require('../utils/db');  // Import the raw connection pool (using pg)
const jwt = require("jsonwebtoken");

const getActivity = async (req, res) => {
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const quarter_name = req.body.quarter_name;

  if (!token) {
    return res.status(401).send("Access Denied: No Token Provided!");
  }

  try {
    const decodedToken =jwt.verify(token, process.env.JWT_SECRET);
    const user_code = decodedToken.data.user_code;
    const user_role = decodedToken.data.user_type;
    const userState = decodedToken.data.State;
    
    const { financialYear, currentQuarter } = getCurrentFinancialYearAndQuarter();
    let year = req.body.year;
    let requestedFinancialYear;

    if (year === "2023-2024") {
      year = "1";
      requestedFinancialYear = "2023-2024";
    } else if (year === "2024-2025") {
      year = "2";
      requestedFinancialYear = "2024-2025";
    } else if (year === "2025-2026") {
      year = "3";
      requestedFinancialYear = "2025-2026";
    }

    const district = req.body.district;

    const allActivitiesQuery = `
      SELECT 
        a.activity_id::VARCHAR,
        a.activity,
        q.quarter_name,
        a.quarter,
        a.quarter_id,
        q.quarter_status as status,
        q.quarter_attachment  -- Ensure we select quarter_attachment here
      FROM activity a
      JOIN quarter q ON a.quarter_id = q.quarter_id
      WHERE a.year = $1;
    `;
    const allActivitiesResult = await pool.query(allActivitiesQuery, [year]);

    if (allActivitiesResult.rows.length === 0) {
      console.log('No activities found for the provided year.');
      return res.status(404).send('No activities found for the provided year');
    }

    let activityData = [];
   let activityRecordQuery = `
  SELECT 
    ar.activity_id::VARCHAR,
    ar.activity_status,
    ar.start_date,
    ar.due_date,
    ar.activity_remarks,
    a.activity,
    q.quarter_name,
    q.quarter_id,
    q.quarter_status,
    q.quarter_attachment,
    q.quarter_attachment_filename
  FROM activity_record ar
  JOIN activity a ON ar.activity_id::VARCHAR = a.activity_id::VARCHAR
  JOIN quarter q ON a.quarter_id = q.quarter_id
  WHERE ar.sp_id = $1 AND ar.sp_district = $2 AND ar.year = $3
`;

if (user_role === 'SP') {
  if (typeof quarter_name === 'string') {
    // Fetch activity records for the specific quarter provided
    activityRecordQuery += ` AND q.quarter_name = $4`;  // Added q.quarter_name reference to match table name
    const activityRecordResult = await pool.query(activityRecordQuery, [user_code, district, year, quarter_name]);

    if (activityRecordResult.rows.length > 0) {
      activityRecordResult.rows.forEach((record) => {
        activityData.push({
          activity_id: record.activity_id,
          activity: record.activity,
          quarter_name: record.quarter_name,
          startDate: formatDate(record.start_date),
          dueDate: formatDate(record.due_date),
          status: record.activity_status,
          quarter_status:record.quarter_status,
          remark: record.activity_remarks,
          quarter_id: record.quarter_id,
          quarter_attachment_filename: record.quarter_attachment_filename,
          quarter_enabled: (record.quarter_name === currentQuarter && requestedFinancialYear === financialYear),
          quarter_attachment: record.quarter_attachment  // Ensure attachment is included
        });
      });
    }
  } else {
    // Fetch activity records for all quarters when quarter_name is not provided
    const activityRecordResult = await pool.query(activityRecordQuery, [user_code, district, year]);

    if (activityRecordResult.rows.length > 0) {
      activityRecordResult.rows.forEach((record) => {
        activityData.push({
          activity_id: record.activity_id,
          activity: record.activity,
          quarter_name: record.quarter_name,
          startDate: formatDate(record.start_date),
          dueDate: formatDate(record.due_date),
          status: record.activity_status,
          quarter_status:record.quarter_status,
          remark: record.activity_remarks,
          quarter_id: record.quarter_id,
          quarter_attachment_filename: record.quarter_attachment_filename,
          quarter_enabled: (record.quarter_name === currentQuarter && requestedFinancialYear === financialYear),
          quarter_attachment: record.quarter_attachment  // Ensure attachment is included
        });
      });
    }

    // Fill missing activities not present in the activity records
    const activityRecordIds = activityRecordResult.rows.map(record => record.activity_id);
    const missingActivities = allActivitiesResult.rows.filter(activity => !activityRecordIds.includes(activity.activity_id));

    missingActivities.forEach((act) => {
      activityData.push({
        activity_id: act.activity_id,
        activity: act.activity,
        quarter_name: act.quarter_name,
        startDate: null,
        dueDate: null,
        status: null,
        remark: null,
        quarter_id: act.quarter_id,
        quarter_enabled: (act.quarter_name === currentQuarter && requestedFinancialYear === financialYear),
        quarter_attachment: act.quarter_attachment  // Ensure attachment is included for missing activities
      });
    });
  }
}

else if (user_role === 'DC') {
  // Query to get the DC's district from tblUser
  const dcDistrictQuery = `SELECT "District" FROM "tblUser" WHERE user_code = $1`;
  const dcDistrictResult = await pool.query(dcDistrictQuery, [user_code]);

  // If no district is found for the provided user code
  if (dcDistrictResult.rows.length === 0) {
    return res.status(404).send('No district found for the provided DC');
  }

  // Parse the district array and cast the value to VARCHAR if needed
  const dcDistrictArray = dcDistrictResult.rows[0].District ? (dcDistrictResult.rows[0].District) : [];
  let dcDistrict = dcDistrictArray.length > 0 ? dcDistrictArray[0] : null;

  // Ensure dcDistrict is treated as a string
  dcDistrict = String(dcDistrict); // Ensure it's treated as a string in case it's numeric

  // If the district array is empty or invalid
  if (!dcDistrict) {
    return res.status(404).send('No district found for the provided DC');
  }

  // Modify the query based on whether a specific quarter is requested or all quarters
  let queryParams = [dcDistrict, year];
  if (typeof quarter_name === 'string') {
    activityRecordQuery += ` AND q.quarter_name = $3`;
    queryParams.push(quarter_name); // Add the third parameter for quarter_name
  }

  // Explicit type casting to VARCHAR for the query
  const activityRecordQuery = `
    SELECT 
      ar.activity_id::VARCHAR,
      ar.activity_status,
      ar.start_date,
      ar.due_date,
      ar.activity_remarks,
      a.activity,
      q.quarter_name,
      q.quarter_id,
    q.quarter_status,
      ar.sp_name,
      q.quarter_attachment,
      q.quarter_attachment_filename
    FROM activity_record ar
    JOIN activity a ON ar.activity_id::VARCHAR = a.activity_id::VARCHAR
    JOIN quarter q ON a.quarter_id = q.quarter_id
    WHERE ar.sp_district = $1::VARCHAR AND a.year = $2
  `;

  // Run the query with the dynamically constructed parameters
  const activityRecordResult = await pool.query(activityRecordQuery, queryParams);

  if (activityRecordResult.rows.length > 0) {
    activityRecordResult.rows.forEach((record) => {
      activityData.push({
        activity_id: record.activity_id,
        activity: record.activity,
        quarter_name: record.quarter_name,
        startDate: formatDate(record.start_date),
        dueDate: formatDate(record.due_date),
        status: record.activity_status,
        remark: record.activity_remarks,
        quarter_id: record.quarter_id,
        quarter_attachment_filename: record.quarter_attachment_filename,
        sp_name: record.sp_name,
        quarter_enabled: (record.quarter_name === currentQuarter && requestedFinancialYear === financialYear)
      });
    });
  }

  // Fill missing activities not present in the activity records
  const activityRecordIds = activityRecordResult.rows.map(record => record.activity_id);
  const missingActivities = allActivitiesResult.rows.filter(activity => !activityRecordIds.includes(activity.activity_id));

  missingActivities.forEach((act) => {
    activityData.push({
      activity_id: act.activity_id,
      activity: act.activity,
      quarter_name: act.quarter_name,
      startDate: null,
      dueDate: null,
      status: null,
      remark: null,
      quarter_id: act.quarter_id,
      quarter_enabled: (act.quarter_name === currentQuarter && requestedFinancialYear === financialYear)
    });
  });
}
 else if (user_role === 'SLA') {
      if (typeof quarter_name === 'string') {
        activityRecordQuery = `
          SELECT 
            ar.activity_id::VARCHAR,
            ar.activity_status,
            ar.start_date,
            ar.due_date,
            ar.activity_remarks,
            a.activity,
            q.quarter_name,
            q.quarter_id,
    q.quarter_status,
            ar.sp_name,
            q.quarter_attachment,
            q.quarter_attachment_filename
          FROM activity_record ar
          JOIN activity a ON ar.activity_id::VARCHAR = a.activity_id::VARCHAR
          JOIN quarter q ON a.quarter_id = q.quarter_id
          WHERE ar.State = $1 AND a.year = $2 AND q.quarter_name = $3;
        `;
      } else {
        activityRecordQuery = `
          SELECT 
            ar.activity_id::VARCHAR,
            ar.activity_status,
            ar.start_date,
            ar.due_date,
            ar.activity_remarks,
            a.activity,
            q.quarter_name,
            q.quarter_id,
    q.quarter_status,
            ar.sp_name,
            q.quarter_attachment,
            q.quarter_attachment_filename
          FROM activity_record ar
          JOIN activity a ON ar.activity_id::VARCHAR = a.activity_id::VARCHAR
          JOIN quarter q ON a.quarter_id = q.quarter_id
          WHERE ar.State = $1 AND a.year = $2;
        `;
      }

      const activityRecordResult = await pool.query(activityRecordQuery, [userState, year, quarter_name].slice(0, typeof quarter_name === 'string' ? 3 : 2));

      if (activityRecordResult.rows.length > 0) {
        activityRecordResult.rows.forEach((record) => {
          activityData.push({
            activity_id: record.activity_id,
            activity: record.activity,
            quarter_name: record.quarter_name,
            startDate: formatDate(record.start_date),
            dueDate: formatDate(record.due_date),
            status: record.activity_status,
            remark: record.activity_remarks,
            quarter_id: record.quarter_id,
            quarter_attachment_filename: record.quarter_attachment_filename,
            sp_name: record.sp_name,
            quarter_enabled: (record.quarter_name === currentQuarter && requestedFinancialYear === financialYear)
            // quarter_attachment: record.quarter_attachment_filename
          });
        });
      }

      const activityRecordIds = activityRecordResult.rows.map(record => record.activity_id);
      const missingActivities = allActivitiesResult.rows.filter(activity => !activityRecordIds.includes(activity.activity_id));

      missingActivities.forEach((act) => {
        activityData.push({
          activity_id: act.activity_id,
          activity: act.activity,
          quarter_name: act.quarter_name,
          startDate: null,
          dueDate: null,
          status: null,
          remark: null,
          quarter_id: act.quarter_id,
          quarter_enabled: (act.quarter_name === currentQuarter && requestedFinancialYear === financialYear)
          // quarter_attachment: act.quarter_attachment_filename
        });
      });
    }

    const groupedData = activityData.reduce((acc, row) => {
      const quarterEntry = acc.find(entry => entry.quarter_name === row.quarter_name);

      const activityDataEntry = {
        activity_id: row.activity_id,
        activity: row.activity,
        startDate: row.startDate || null,
        dueDate: row.dueDate || null,
        status: row.status || null,
        remarks: row.remark || null,
        quarter_id: row.quarter_id,
        ...(user_role === 'DC' ? { sp_name: row.sp_name } : {}),
        quarter_enabled: (row.quarter_name === currentQuarter && requestedFinancialYear === financialYear)
        // quarter_attachment: row.quarter_attachment_filename // Ensure quarter_attachment is included in the response
      };

      if (quarterEntry) {
        quarterEntry.tabledata.push(activityDataEntry);
      } else {
        // acc.push({
        //   quarter_name: row.quarter_name,
        //   tabledata: [activityDataEntry],
        //   status:row.quarter_status,
        //   quarter_attachment_filename:row.quarter_attachment_filename,
        //   quarter_enabled: (row.quarter_name === currentQuarter && requestedFinancialYear === financialYear)
        // });
        acc.push({
          quarter_name: row.quarter_name,
          tabledata: [activityDataEntry],
          status: row.quarter_status,
          quarter_attachment_filename: row.quarter_attachment_filename,
          quarter_enabled: (row.quarter_name === currentQuarter && requestedFinancialYear === financialYear),
          approved: row.quarter_status=== "Approved" ? true : false  // Send true if quarter_status is "approved", otherwise false
        });
        
      }
      return acc;
    }, []);

    console.log('Sending grouped data.',groupedData);
    return res.status(200).json(groupedData);

  } catch (err) {
    console.error('Error fetching activities:', err);
    return res.status(500).send('Internal Server Error');
  }
};

// Helper function to get current financial year and quarter
function getCurrentFinancialYearAndQuarter() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
  const currentYear = currentDate.getFullYear();

  let financialYear;
  let currentQuarter;

  // Determine the current financial year
  if (currentMonth >= 4) {
    financialYear = `${currentYear}-${currentYear + 1}`;
  } else {
    financialYear = `${currentYear - 1}-${currentYear}`;
  }

  // Determine the current quarter
  if (currentMonth >= 4 && currentMonth <= 6) {
    currentQuarter = 'Quarter 1';
  } else if (currentMonth >= 7 && currentMonth <= 9) {
    currentQuarter = 'Quarter 2';
  } else if (currentMonth >= 10 && currentMonth <= 12) {
    currentQuarter = 'Quarter 3';
  } else {
    currentQuarter = 'Quarter 4';
  }

  return { financialYear, currentQuarter };
}
function formatDate(date) {
  if (!date) return null;
  const formattedDate = new Date(date);
  const day = String(formattedDate.getDate()).padStart(2, '0');
  const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
  const year = formattedDate.getFullYear();
  return `${day}-${month}-${year}`;
}



module.exports = {
  getActivity,
};



// const pool = require('../utils/db');  // Import the raw connection pool (using pg)
// const jwt = require("jsonwebtoken");

// const getActivity = async (req, res) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];
//   const quarter_name = req.body.quarter_name;

//   if (!token) {
//     return res.status(401).send("Access Denied: No Token Provided!");
//   }

//   try {
//     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//     const user_code = decodedToken.data.user_code;
//     const user_role = decodedToken.data.user_type;
//     const userState = decodedToken.data.State;

//     const { financialYear, currentQuarter } = getCurrentFinancialYearAndQuarter();
//     let year = req.body.year;

//     // Convert the financial year string to a numeric year
//     const yearMap = {
//       "2023-2024": 1,
//       "2024-2025": 2,
//       "2025-2026": 3
//     };

//     if (yearMap[year] === undefined) {
//       return res.status(400).send("Invalid year provided");
//     }

//     const numericYear = yearMap[year];
//     const district = req.body.district;

//     // Common query to fetch all activities for the year
//     const allActivitiesResult = await pool.query(`
//       SELECT 
//         a.activity_id::VARCHAR,
//         a.activity,
//         q.quarter_name,
//         a.quarter,
//         a.quarter_id,
//         q.quarter_status as status,
//         q.quarter_attachment
//       FROM activity a
//       JOIN quarter q ON a.quarter_id = q.quarter_id
//       WHERE a.year = $1;
//     `, [numericYear]);

//     if (allActivitiesResult.rows.length === 0) {
//       return res.status(404).send('No activities found for the provided year');
//     }

//     // Consolidate query conditions and reuse query templates
//     let activityRecordQuery = `
//       SELECT 
//         ar.activity_id::VARCHAR,
//         ar.activity_status,
//         ar.start_date,
//         ar.due_date,
//         ar.activity_remarks,
//         a.activity,
//         q.quarter_name,
//         q.quarter_id,
//         q.quarter_status,
//         ar.sp_name,
//         q.quarter_attachment,
//         q.quarter_attachment_filename
//       FROM activity_record ar
//       JOIN activity a ON ar.activity_id::VARCHAR = a.activity_id::VARCHAR
//       JOIN quarter q ON a.quarter_id = q.quarter_id
//       WHERE ar.year = $1
//     `;

//     let queryParams = [numericYear];

//     if (user_role === 'SP') {
//       activityRecordQuery += ` AND ar.sp_id = $2 AND ar.sp_district = $3`;
//       queryParams.push(user_code, district);
//     } else if (user_role === 'DC') {
//       const dcDistrictResult = await pool.query(`
//         SELECT "District" FROM "tblUser" WHERE user_code = $1
//       `, [user_code]);

//       if (dcDistrictResult.rows.length === 0) {
//         return res.status(404).send('No district found for the provided DC');
//       }

//       const dcDistrict = String(dcDistrictResult.rows[0].District);
//       activityRecordQuery += ` AND ar.sp_district = $2`;
//       queryParams.push(dcDistrict);
//     } else if (user_role === 'SLA') {
//       activityRecordQuery += ` AND ar.State = $2`;
//       queryParams.push(userState);
//     }

//     if (typeof quarter_name === 'string') {
//       activityRecordQuery += ` AND q.quarter_name = $${queryParams.length + 1}`;
//       queryParams.push(quarter_name);
//     }

//     // Execute the activity record query
//     const activityRecordResult = await pool.query(activityRecordQuery, queryParams);

//     let activityData = buildActivityData(activityRecordResult.rows, currentQuarter, financialYear);

//     // Fill missing activities
//     const activityRecordIds = activityRecordResult.rows.map(record => record.activity_id);
//     const missingActivities = allActivitiesResult.rows.filter(activity => !activityRecordIds.includes(activity.activity_id));

//     activityData = fillMissingActivities(activityData, missingActivities, currentQuarter, financialYear);

//     const groupedData = groupActivityData(activityData, currentQuarter, financialYear);

//     return res.status(200).json(groupedData);

//   } catch (err) {
//     console.error('Error fetching activities:', err);
//     return res.status(500).send('Internal Server Error');
//   }
// };

// function getCurrentFinancialYearAndQuarter() {
//   const currentDate = new Date();
//   const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
//   const currentYear = currentDate.getFullYear();

//   let financialYear;
//   let currentQuarter;

//   // Determine the current financial year
//   if (currentMonth >= 4) {
//     financialYear = `${currentYear}-${currentYear + 1}`;
//   } else {
//     financialYear = `${currentYear - 1}-${currentYear}`;
//   }

//   // Determine the current quarter
//   currentQuarter = determineQuarter(currentMonth);

//   return { financialYear, currentQuarter };
// }

// function determineQuarter(currentMonth) {
//   if (currentMonth >= 4 && currentMonth <= 6) {
//     return 'Quarter 1';
//   } else if (currentMonth >= 7 && currentMonth <= 9) {
//     return 'Quarter 2';
//   } else if (currentMonth >= 10 && currentMonth <= 12) {
//     return 'Quarter 3';
//   } else {
//     return 'Quarter 4';
//   }
// }

// function buildActivityData(rows, currentQuarter, requestedFinancialYear) {
//   return rows.map(record => ({
//     activity_id: record.activity_id,
//     activity: record.activity,
//     quarter_name: record.quarter_name,
//     startDate: formatDate(record.start_date),
//     dueDate: formatDate(record.due_date),
//     status: record.activity_status,
//     remark: record.activity_remarks,
//     quarter_id: record.quarter_id,
//     quarter_attachment_filename: record.quarter_attachment_filename,
//     sp_name: record.sp_name || null,
//     quarter_enabled: (record.quarter_name === currentQuarter && requestedFinancialYear === requestedFinancialYear)  // Ensure usage of requestedFinancialYear
//   }));
// }


function buildActivityData(rows, currentQuarter, financialYear) {
  return rows.map(record => ({
    activity_id: record.activity_id,
    activity: record.activity,
    quarter_name: record.quarter_name,
    startDate: formatDate(record.start_date),
    dueDate: formatDate(record.due_date),
    status: record.activity_status,
    remark: record.activity_remarks,
    quarter_id: record.quarter_id,
    quarter_attachment_filename: record.quarter_attachment_filename,
    sp_name: record.sp_name || null,
    // Maintain the logic for enabling the quarter based on financial year and current quarter
    quarter_enabled: (record.quarter_name === currentQuarter && financialYear === financialYear)
  }));
}

function fillMissingActivities(activityData, missingActivities, currentQuarter, requestedFinancialYear) {
  missingActivities.forEach((act) => {
    activityData.push({
      activity_id: act.activity_id,
      activity: act.activity,
      quarter_name: act.quarter_name,
      startDate: null,
      dueDate: null,
      status: null,
      remark: null,
      quarter_id: act.quarter_id,
      quarter_enabled: (act.quarter_name === currentQuarter && requestedFinancialYear === financialYear),
      quarter_attachment: act.quarter_attachment
    });
  });

  return activityData;
}

function groupActivityData(activityData, currentQuarter, requestedFinancialYear) {
  return activityData.reduce((acc, row) => {
    const quarterEntry = acc.find(entry => entry.quarter_name === row.quarter_name);

    const activityDataEntry = {
      activity_id: row.activity_id,
      activity: row.activity,
      startDate: row.startDate || null,
      dueDate: row.dueDate || null,
      status: row.status || null,
      remarks: row.remark || null,
      quarter_id: row.quarter_id,
      ...(row.sp_name ? { sp_name: row.sp_name } : {}),
      quarter_enabled: row.quarter_enabled
    };

    if (quarterEntry) {
      quarterEntry.tabledata.push(activityDataEntry);
    } else {
      acc.push({
        quarter_name: row.quarter_name,
        tabledata: [activityDataEntry],
        quarter_attachment_filename: row.quarter_attachment_filename,
        quarter_enabled: row.quarter_enabled
      });
    }

    return acc;
  }, []);
}

function formatDate(date) {
  if (!date) return null;
  const formattedDate = new Date(date);
  return `${String(formattedDate.getDate()).padStart(2, '0')}-${String(formattedDate.getMonth() + 1).padStart(2, '0')}-${formattedDate.getFullYear()}`;
}

module.exports = {
  getActivity,
};




// const pool = require('../utils/db');  // Import the raw connection pool (using pg)
// const jwt = require("jsonwebtoken");

// const getActivity = async (req, res) => {
  
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];
//   const quarter_name = req.body.quarter_name;

//   if (!token) {
//     return res.status(401).send("Access Denied: No Token Provided!");
//   }

//   try {
//     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//     const user_code = decodedToken.data.user_code;
//     const user_role = decodedToken.data.user_type;
//     const userState = decodedToken.data.State;
    
//     const { financialYear, currentQuarter } = getCurrentFinancialYearAndQuarter();
//     let year = req.body.year;
//     let requestedFinancialYear;

//     if (year === "2023-2024") {
//       year = "1";
//       requestedFinancialYear = "2023-2024";
//     } else if (year === "2024-2025") {
//       year = "2";
//       requestedFinancialYear = "2024-2025";
//     } else if (year === "2025-2026") {
//       year = "3";
//       requestedFinancialYear = "2025-2026";
//     }

//     const district = req.body.district;

//     // Consolidating the common query logic to avoid repeated queries
//     let baseQuery = `
//       SELECT 
//         ar.activity_id::VARCHAR,  -- Explicitly cast activity_id to VARCHAR
//         ar.activity_status,
//         ar.start_date,
//         ar.due_date,
//         ar.activity_remarks,
//         a.activity,
//         q.quarter_name,
//         q.quarter_id,
//         q.quarter_attachment,
//         q.quarter_attachment_filename,
//         ar.sp_name,
//         a.year
//       FROM activity_record ar
//       JOIN activity a ON ar.activity_id::VARCHAR = a.activity_id::VARCHAR  -- Cast both sides to VARCHAR
//       JOIN quarter q ON a.quarter_id = q.quarter_id
//       WHERE a.year = $1
//     `;

//     // Add role-specific conditions dynamically
//     let queryParams = [year];
//     if (user_role === 'SP') {
//       baseQuery += ` AND ar.sp_id = $2::VARCHAR AND ar.sp_district = $3::VARCHAR`;  // Cast sp_id and sp_district to VARCHAR
//       queryParams.push(user_code, district);
//       if (quarter_name) {
//         baseQuery += ` AND q.quarter_name = $4`;
//         queryParams.push(quarter_name);
//       }
//     } else if (user_role === 'DC') {
//       const dcDistrictQuery = `SELECT "District" FROM "tblUser" WHERE user_code = $2::VARCHAR`;  // Cast user_code to VARCHAR
//       const dcDistrictResult = await pool.query(dcDistrictQuery, [user_code]);
//       if (dcDistrictResult.rows.length === 0) {
//         return res.status(404).send('No district found for the provided DC');
//       }
//       const dcDistrict = dcDistrictResult.rows[0].District[0];  // Assuming district is stored as an array
//       baseQuery += ` AND ar.sp_district = $2::VARCHAR`;  // Cast sp_district to VARCHAR
//       queryParams.push(dcDistrict);
//       if (quarter_name) {
//         baseQuery += ` AND q.quarter_name = $3`;
//         queryParams.push(quarter_name);
//       }
//     } else if (user_role === 'SLA') {
//       baseQuery += ` AND ar.State = $2::VARCHAR`;  // Cast State to VARCHAR
//       queryParams.push(userState);
//       if (quarter_name) {
//         baseQuery += ` AND q.quarter_name = $3`;
//         queryParams.push(quarter_name);
//       }
//     }

//     // Run the consolidated query for fetching activity records
//     const activityRecordResult = await pool.query(baseQuery, queryParams);

//     // Fetch all activities to check missing ones
//     const allActivitiesQuery = `
//       SELECT 
//         a.activity_id::VARCHAR,  -- Explicitly cast activity_id to VARCHAR
//         a.activity,
//         q.quarter_name,
//         a.quarter,
//         a.quarter_id,
//         q.quarter_status as status,
//         q.quarter_attachment
//       FROM activity a
//       JOIN quarter q ON a.quarter_id = q.quarter_id
//       WHERE a.year = $1;
//     `;
//     const allActivitiesResult = await pool.query(allActivitiesQuery, [year]);

//     let activityData = [];
//     if (activityRecordResult.rows.length > 0) {
//       activityRecordResult.rows.forEach((record) => {
//         activityData.push({
//           activity_id: record.activity_id,
//           activity: record.activity,
//           quarter_name: record.quarter_name,
//           startDate: formatDate(record.start_date),
//           dueDate: formatDate(record.due_date),
//           status: record.activity_status,
//           remark: record.activity_remarks,
//           quarter_id: record.quarter_id,
//           quarter_attachment_filename: record.quarter_attachment_filename,
//           sp_name: record.sp_name,
//           quarter_enabled: (record.quarter_name === currentQuarter && requestedFinancialYear === financialYear),
//           quarter_attachment: record.quarter_attachment  // Ensure attachment is included
//         });
//       });
//     }

//     // Fill missing activities
//     const activityRecordIds = activityRecordResult.rows.map(record => record.activity_id);
//     const missingActivities = allActivitiesResult.rows.filter(activity => !activityRecordIds.includes(activity.activity_id));

//     missingActivities.forEach((act) => {
//       activityData.push({
//         activity_id: act.activity_id,
//         activity: act.activity,
//         quarter_name: act.quarter_name,
//         startDate: null,
//         dueDate: null,
//         status: null,
//         remark: null,
//         quarter_id: act.quarter_id,
//         quarter_enabled: (act.quarter_name === currentQuarter && requestedFinancialYear === financialYear),
//         quarter_attachment: act.quarter_attachment  // Ensure attachment is included for missing activities
//       });
//     });

//     const groupedData = activityData.reduce((acc, row) => {
//       const quarterEntry = acc.find(entry => entry.quarter_name === row.quarter_name);

//       const activityDataEntry = {
//         activity_id: row.activity_id,
//         activity: row.activity,
//         startDate: row.startDate || null,
//         dueDate: row.dueDate || null,
//         status: row.status || null,
//         remarks: row.remark || null,
//         quarter_id: row.quarter_id,
//         ...(user_role === 'DC' ? { sp_name: row.sp_name } : {}),
//         quarter_enabled: (row.quarter_name === currentQuarter && requestedFinancialYear === financialYear)
//       };

//       if (quarterEntry) {
//         quarterEntry.tabledata.push(activityDataEntry);
//       } else {
//         acc.push({
//           quarter_name: row.quarter_name,
//           tabledata: [activityDataEntry],
//           quarter_attachment_filename: row.quarter_attachment_filename,
//           quarter_enabled: (row.quarter_name === currentQuarter && requestedFinancialYear === financialYear)
//         });
//       }
//       return acc;
//     }, []);

//     console.log('Sending grouped data.', groupedData);
//     return res.status(200).json(groupedData);

//   } catch (err) {
//     console.error('Error fetching activities:', err);
//     return res.status(500).send('Internal Server Error');
//   }
// };

// // Helper function to get current financial year and quarter
// function getCurrentFinancialYearAndQuarter() {
//   const currentDate = new Date();
//   const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
//   const currentYear = currentDate.getFullYear();

//   let financialYear;
//   let currentQuarter;

//   // Determine the current financial year
//   if (currentMonth >= 4) {
//     financialYear = `${currentYear}-${currentYear + 1}`;
//   } else {
//     financialYear = `${currentYear - 1}-${currentYear}`;
//   }

//   // Determine the current quarter
//   if (currentMonth >= 4 && currentMonth <= 6) {
//     currentQuarter = 'Quarter 1';
//   } else if (currentMonth >= 7 && currentMonth <= 9) {
//     currentQuarter = 'Quarter 2';
//   } else if (currentMonth >= 10 && currentMonth <= 12) {
//     currentQuarter = 'Quarter 3';
//   } else {
//     currentQuarter = 'Quarter 4';
//   }

//   return { financialYear, currentQuarter };
// }

// function formatDate(date) {
//   if (!date) return null;
//   const formattedDate = new Date(date);
//   const day = String(formattedDate.getDate()).padStart(2, '0');
//   const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
//   const year = formattedDate.getFullYear();
//   return `${day}-${month}-${year}`;
// }

// module.exports = {
//   getActivity,
// };



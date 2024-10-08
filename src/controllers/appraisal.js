
const pool = require('../utils/db');  // Import the raw connection pool (using pg)
const jwt = require("jsonwebtoken");


const createAppraisal= async(req,res)=>{
    try {

        // Extract user_code and user_role from the token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    
        if (!token) {
          return res.status(401).send("Access Denied: No Token Provided!");
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user_code = decoded.data.user_code;
        const user_role = decoded.data.user_type; // Check if the user is a DC
        const userState = decoded.data.State;
    
        // Extract and validate input data
        let sp_district = req.body.sp_district; // Treat sp_district as a single text value
        let quarter_status = req.body.quarter_status;
        // console.log(quarter_status,'-------1226')
        let dlmc_remarks = req.body.dlmc_rsemarks;
        let requisition_amnt = req.body.requisition_amnt; // Get requisition amount
        let requisition_date = new Date(); // Set current date for requisition_date
        let year = req.body.year;
    
        if (year === "2023-2024") {
          year = "1";
        } else if (year === "2024-2025") {
          year = "2";
        } else if (year === "2025-2026") {
          year = "3";
        }

        // Handle file upload for quarter_attachment
        // let quarter_attachment = req.file ? req.file.buffer : null; // Use req.file to access the uploaded file
        // let quarter_attachment_filename = req.file ? req.file.originalname : null; // Get original filename
        let file=req.files
        let quarter_attachment=file[0].buffer
        let quarter_attachment_filename=file[0].originalname
        // Ensure tabledata is a string before parsing it
        let activity_data;
        if (typeof req.body.tabledata === 'string') {
          activity_data = JSON.parse(req.body.tabledata); // Parse if in JSON format
        } else if (typeof req.body.tabledata === 'object') {
          activity_data = req.body.tabledata; // If already an object
        } else {
          throw new Error('Invalid format for tabledata');
        }
    
        // Fetch the user details
        const userQuery = `SELECT * FROM "tblUser" WHERE user_code = $1`;
        const userResult = await pool.query(userQuery, [user_code]);
        if (userResult.rows.length === 0) {
          return res.status(404).send('User not found');
        }
    
        const sp_name = userResult.rows[0].user_name;
        const userDistrictArray = (userResult.rows[0].District || '[]');
        const userDistrict = userDistrictArray.length > 0 ? userDistrictArray[0] : null; // Get the first district
    
        // If the user is DC, update quarter status and dc_id
        if (user_role === 'DC' && userDistrict) {
          for (const ele of activity_data) {
            let quarter_id = ele.quarter_id;
    
            // Fetch quarter name from quarter table using quarter_id
            const quarterQuery = `SELECT quarter_name FROM quarter WHERE quarter_id = $1`;
            const quarterResult = await pool.query(quarterQuery, [quarter_id]);
            if (quarterResult.rows.length === 0) {
              console.log('No quarter found for quarter_id:', quarter_id);
              continue; // Skip if no quarter is found
            }
            const quarter = quarterResult.rows[0].quarter_name;
    
            // Update the quarter table
            let updateQuarterQuery = `
              UPDATE quarter
              SET quarter_status = $1, remarks_by_dlmc = $2
              WHERE quarter_id = $3
            `;
            await pool.query(updateQuarterQuery, [quarter_status, dlmc_remarks, quarter_id]);
    
            // Update dc_id in activity_record table
            let updateDcQuery = `
              UPDATE public.activity_record
              SET dc_id = $1
              WHERE sp_district = $2 AND quarter_id = $3
            `;
            await pool.query(updateDcQuery, [user_code, userDistrict, quarter_id]);
          }
    
          // After DC updates are done, send a response specific to DC
          return res.status(200).send('DC appraisal updates processed successfully');
        } else if (user_role === 'SLA' && userState) {
          // SLA Logic
          // Fetch all activity records for the SLA user's state and approved quarters
          let slaQuery = `
            SELECT ar.quarter_id, q.quarter_name, q.quarter_status, q.requisition_amnt, q.requisition_date, q.approval_amnt, 
                   q.approval_amnt_attachment, q.approval_amnt_attachment_filename
            FROM activity_record ar
            JOIN quarter q ON ar.quarter_id = q.quarter_id
            WHERE ar.State = $1 AND q.year = $2 AND q.quarter_status = 'Approved'`;
          console.log(slaQuery, userState, year, '------164');
          pool.query(slaQuery, [userState, year], async (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).send("Error fetching SLA data.");
            } else if (result.rows.length === 0) {
              return res.json([]);
            } else {
              // Map to update the approved amount and its attachment in the `quarter` table
              const updates = result.rows.map(async (row) => {
                let updateQuery = `
                  UPDATE quarter
                  SET approval_amnt = $1, approval_amnt_attachment = $2, approval_amnt_attachment_filename = $3
                  WHERE quarter_id = $4 AND quarter_status = 'Approved'`;  // Removed the `state` condition as it's not in `quarter`
    
                let approvalAmnt = req.body.approval_amnt;
                let approvalAmntAttachment = req.file ? req.file.buffer : null;
                let approvalAmntAttachmentFilename = req.file ? req.file.originalname : null;
    
                await pool.query(updateQuery, [approvalAmnt, approvalAmntAttachment, approvalAmntAttachmentFilename, row.quarter_id]);
              });
    
              await Promise.all(updates);
              res.status(200).send("SLA approval processed successfully");
            }
          });
    
        }
    
        // SP Logic remains unchanged
        // Process each activity data for SP
        console.log('here')
        for (const ele of activity_data) {
          let activity_id = ele.activity_id;
          let activity_name = ele.activity.trim().replace(/\s+/g, ' ').toLowerCase(); // Normalize whitespace and case
          let remarks = ele.remarks || '';
          let startDate = ele.startDate || null;
          let dueDate = ele.dueDate || null;
          let status = ele.status || '';
          let quarter_id = ele.quarter_id;
    
          // Fetch quarter name from quarter table
          let quarterQuery = `SELECT * FROM quarter WHERE quarter_id = $1`;
          let quarterResult;
          try {
            quarterResult = await pool.query(quarterQuery, [quarter_id]);
          } catch (err) {
            console.error('Error fetching quarter:', err);
            continue; // Skip this iteration on error
          }
    
          if (quarterResult.rows.length === 0) {
            console.log('No quarter found for quarter_id:', quarter_id);
            continue; // Skip if no quarter is found
          }
    
          let quarter = quarterResult.rows[0].quarter_name;
    
          // Check if the record already exists
          const checkQuery = `
            SELECT * FROM public.activity_record 
            WHERE sp_id = $1 AND activity_id = $2 AND quarter_id = $3 AND sp_district = $4
          `;
          let checkResult;
          try {
            checkResult = await pool.query(checkQuery, [user_code, activity_id, quarter_id, sp_district]);
          } catch (err) {
            console.error('Error checking activity record:', err);
            continue; // Skip this iteration on error
          }
    
          if (checkResult.rows.length > 0) {
            // Update the existing record
            let updateRecordQuery = `
              UPDATE public.activity_record
              SET activity_status = $1, start_date = $2, due_date = $3, activity_remarks = $4, sp_name = $5
              WHERE sp_id = $6 AND activity_id = $7 AND quarter_id = $8 AND sp_district = $9
            `;
            try {
              await pool.query(updateRecordQuery, [status, startDate, dueDate, remarks, sp_name, user_code, activity_id, quarter_id, sp_district]);
            } catch (err) {
              console.error('Error updating activity record:', err);
              continue; // Skip this iteration on error
            }
          } else {
            // Insert new activity record into activity_record table
            let recordQuery = `
              INSERT INTO public.activity_record
              (sp_district, sp_id, activity_id, year, activity_status, quarter_id, start_date, due_date, activity_remarks, sp_name, State)
              VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;
            let values = [sp_district, user_code, activity_id, year, status, quarter_id, startDate, dueDate, remarks, sp_name, userState];
           console.log(recordQuery,values,'--------')
            try {
              await pool.query(recordQuery, values);
            } catch (err) {
              console.error('Error inserting activity record:', err);
              continue; // Skip this iteration on error
            }
          }
    
          // Handle quarter attachment and update, and update requisition amount and date if quarter_status is 'approved'
          if (quarter_status === 'Approved') {
            let updateQuarterQuery = `
              UPDATE quarter
              SET requisition_amnt = $1, requisition_date = $2
              WHERE quarter_name = $3 AND quarter_id = $4
            `;
            try {
              await pool.query(updateQuarterQuery, [
                requisition_amnt, // Use $4 for amount update
                requisition_date, // Use $5 for date update
                quarter,
                quarter_id,
              ]);
              console.log('Quarter updated with requisition details');
            } catch (err) {
              console.error('Error updating quarter requisition details:', err);
              continue; // Skip this iteration on error
            }
          } else {
            let updateQuarterQuery = `
              UPDATE quarter
              SET quarter_attachment = $1, quarter_attachment_filename = $2, quarter_status = $3
              WHERE quarter_name = $4 AND quarter_id = $5
            `;
            try {
              await pool.query(updateQuarterQuery, [
                quarter_attachment,
                quarter_attachment_filename,
                quarter_status,
                quarter,
                quarter_id,
              ]);
            } catch (err) {
              console.error('Error updating quarter:', err);
              continue; // Skip this iteration on error
            }
          }
    
          // Insert into _tblaprsl table
          const aprslQuery = `
            INSERT INTO public."_tblaprsl" (sp_name, activity_id, quarter_id)
            VALUES ($1, $2, $3)
          `;
          try {
            await pool.query(aprslQuery, [sp_name, activity_id, quarter_id]);
          } catch (err) {
            console.error('Error inserting into _tblaprsl table:', err);
            continue; // Skip this iteration on error
          }
        }
    
        // After all activities are processed, send the response
        return res.status(200).send('SP appraisal submitted successfully');
    
      } catch (error) {
        console.error('Error processing appraisal:', error);
        return res.status(500).send('Error processing appraisal');
      }
}



module.exports={
    createAppraisal
}
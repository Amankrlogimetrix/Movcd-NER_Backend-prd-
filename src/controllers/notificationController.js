const { authentication } = require("../middleware/middleware");
const { tblNotification, sequelize } = require("../models");
const { isValidImage } = require("../validation/validation");

const createNotification = async (req, res) => {
  try {
    let {user_type , State} = req.decodedToken.data
    let { notification, Category } = req.body;
    let file = req.files;

    if (!notification) {
      return res
        .status(400)
        .json({ message: "Please provide notification details." });
    }
    if (notification.trim() == "") {
      return res.status(400).json({ message: "Notification can not be empty" });
    }
    if (!Category) {
      return res.status(400).json({ message: "Please provide Category." });
    }
    if (Category.trim() == "" ) {
      return res.status(400).json({ message: "Category can not be empty" });
    }

    notification = notification.trim()

  let allowedCategories;

  if (user_type === "JS") {
    allowedCategories = ["Guidelines", "MOM", "Instructions", "Progress Reports", "Any Other"];
  } else if (user_type === "SLA") {
    allowedCategories = ["Any Other", "Physical", "Financial", "Market Activities", "Infrastructure"];
  } else {
    return res.status(400).json({ message: "Invalid user type." });
  }

  if (!allowedCategories.includes(Category)) {
    return res.status(400).json({ message: `Invalid Category. (${allowedCategories.join(' || ')})` });
  }  

    if (!isValidImage(file[0].originalname)) {
      return res.status(400).json({ message: "Invalid file type." });
    }
    await tblNotification.create({
      Notification: notification,
      Category,
      Attachments: file[0].buffer,
      FileName:file[0].originalname,
      CreatedBy: user_type,
      State: user_type == "SLA" ? State : null
    });
    return res.status(200).send({
      status: true,
      message: "Notificaton created sucessfully",
    });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error", error: error.message });
  }
};

const getNotification = async (req, res) => {
  try {
    let notifications = await tblNotification.findAll({
      where: { isDeleted: false , CreatedBy:"JS"},
      order: [["createdAt", "DESC"]],
      attributes: {
        exclude: ["isDeleted","Attachments"],
      },
    });

    return res
      .status(200)
      .send({ status: true, message: "Sucess", data: notifications });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error", error: error.message });
 }
};

const getNotificationBySLA = async (req, res) => {
  try {

    
      let token = req.cookies.access_token || req.headers?.authorization?.split(" ")[1];

      if (token) {
      await new Promise((resolve, reject) => {
          authentication(req, res, (err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        });

      }
      const { user_type, State } = req.decodedToken?.data || {};

      let whereClause = {
        isDeleted: false,
        CreatedBy:"SLA",
      }
      if(token && user_type == "SLA"){
        whereClause.State = State
      }


    let notifications = await tblNotification.findAll({
      where:whereClause,
      order: [["createdAt", "DESC"]],
      attributes: {
        exclude: ["isDeleted","Attachments"],
      },
    });

    return res
      .status(200)
      .send({ status: true, message: "Sucess", data: notifications });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error", error: error.message });
 }
};

const updateNotification = async (req, res) => {
  try {
    let { notificationId, notification } = req.body;
    if (!notificationId) {
      return res
        .status(400)
        .send({ status: false, message: "notificationId is required" });
    }
    if (!notification) {
      return res
        .status(400)
        .send({ status: false, message: "notification is required" });
    }
    if (notification.trim() == "") {
      return res
        .status(400)
        .send({ status: false, message: "notification can not be empty" });
    }

    let existingNotification = await tblNotification.findByPk(notificationId);

    if (!existingNotification) {
      return res
        .status(404)
        .send({ status: false, message: "Notification not found" });
    }
    if (existingNotification.isDeleted == true) {
      return res
        .status(404)
        .send({ status: false, message: "Notification is deleted" });
    }

    await existingNotification.update({ Notification: notification });

    return res
      .status(200)
      .send({ status: true, message: "Notification updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error", error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    let { notificationId } = req.body;

    if (!notificationId) {
      return res
        .status(400)
        .send({ status: false, message: "Please send notificationId" });
    }

    let existingNotification = await tblNotification.findByPk(notificationId);

    if (!existingNotification) {
      return res
        .status(404)
        .send({ status: false, message: "Notification not found" });
    }

    if (existingNotification.isDeleted) {
      return res
        .status(400)
        .send({ status: true, message: "Notification already deleted" });
    }

    await existingNotification.update({ isDeleted: true });

    return res
      .status(200)
      .send({ status: true, message: "Notification deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .send({ status: false, message: "Server Error", error: error.message });
  }
};

const downloadAttachments = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const existingNotification = await tblNotification.findByPk(notificationId);

    if (!existingNotification) {
      return res.status(400).send({ status: false, message: "File not found" });
    }

    const fileData = existingNotification.Attachments;

    if (!fileData) {
      return res.status(404).send({ status: false, message: "No attachments found" });
    }

    const fileName = `${existingNotification.Notification || 'attachment'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    return res.status(200).send(fileData);

  } catch (error) {
    return res.status(500).send({ status: false, message: "Server Error." });
  }
};


module.exports = {
  createNotification,
  getNotification,
  updateNotification,
  deleteNotification,
  getNotificationBySLA,
  downloadAttachments
};
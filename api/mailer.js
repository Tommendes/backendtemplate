const nodemailer = require("nodemailer")
const { mailer } = require('../.env')

module.exports = app => {
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport(mailer);

    return { transporter }
}
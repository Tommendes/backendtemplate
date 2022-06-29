const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')

module.exports = app => {
    app.use(bodyParser.json({ limit: '10mb', extended: true }))
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))
    app.use(fileUpload())
}
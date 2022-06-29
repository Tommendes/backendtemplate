const express = require('express')
const cors = require('cors')
const app = express()
const consign = require('consign')
const db = require('./config/db')
const fs = require('fs')
const path = require('path')
const logsDir = 'logs'
const moment = require('moment')
const assets = path.join(__dirname, "../../public_html/assets/")
const port = process.env.PORT || 3000

app.use(express.static(assets))
app.use(cors())
app.db = db
app.assets = assets

Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        var error = new Error;
        Error.captureStackTrace(error, arguments.callee);
        var stack = error.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function () {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
    get: function () {
        return __stack[1].getFunctionName();
    }
});

consign()
    .include('./config/passport.js')
    .then('./config/middlewares.js')
    .then('./api/validation.js')
    .then('./api')
    .then('./config/routes.js')
    .into(app)

app.listen(port, async () => {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(path.join(__dirname, logsDir), (error) => {
            if (error) {
                app.api.logger.logInfo({ log: { line: `Directory logs create error! Error: ${error}`, sConsole: false } })
                return console.error(error);
            }
        });
        app.api.logger.logInfo({ log: { line: `Directory logs created successfully!`, sConsole: true } })
    }
    // const clientes = await app.db('params')
    //     .select('value')
    //     .where({ meta: 'clientName', dominio: 'root' })
    //     .andWhereNot({ value: 'root' }).then()
    // clientes.forEach(async elementClient => {
    //     const dominios = await app.db('params')
    //         .select('value')
    //         .where({ meta: 'domainName', dominio: elementClient.value }).then()
    //     dominios.forEach(elementDomain => {
    //         const uploadsDir = `uploads/${elementClient.value}/${elementDomain.value}`
    //         const uploadsDirPath = path.join(assets, uploadsDir)
    //         if (!fs.existsSync(uploadsDirPath)) {
    //             fs.mkdirSync(uploadsDirPath, { recursive: true }, (error) => {
    //                 if (error) {
    //                     app.api.logger.logInfo({ log: { line: `Directory uploads (${uploadsDirPath}) create error! Error: ${error}`, sConsole: false } })
    //                     return console.error(error);
    //                 }
    //             });
    //             app.api.logger.logInfo({ log: { line: `Directory uploads (${uploadsDirPath}) created successfully!`, sConsole: true } })
    //         }
    //         const photosDir = `images/${elementClient.value}/${elementDomain.value}`
    //         const photosDirPath = path.join(assets, photosDir)
    //         if (!fs.existsSync(photosDirPath)) {
    //             fs.mkdirSync(photosDirPath, { recursive: true }, (error) => {
    //                 if (error) {
    //                     app.api.logger.logInfo({ log: { line: `Directory photos (${photosDirPath}) create error! Error: ${error}`, sConsole: false } })
    //                     return console.error(error);
    //                 }
    //             });
    //             app.api.logger.logInfo({ log: { line: `Directory photos (${photosDirPath}) created successfully!`, sConsole: true } })
    //         }
    //     })
    // })
    app.api.logger.logInfo({ log: { line: `Backend executando na porta ${port}`, sConsole: true } })
})
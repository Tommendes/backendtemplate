const fs = require('fs')

module.exports = app => {
    const logInfo = async (req, res) => {
        const log = { ...req.log }
        stream = fs.createWriteStream("./logs/info.txt", { flags: 'a' });
        const line = `[${new Date().toISOString()}] ${req.user ? req.user.name : ''}: ${log.line}`
        stream.write(line + "\n");
        stream.end();
        if (log.sConsole) return console.log(line);
    }
    
    const logError = async (req, res) => {
        const log = { ...req.log }
        stream = fs.createWriteStream("./logs/errors.txt", { flags: 'a' });
        const line = `[${new Date().toISOString()}] ${req.user ? req.user.name : ''}: ${log.line}`
        stream.write(line + "\n");
        stream.end();
        if (log.sConsole) return console.log(line);
    }

    return { logInfo, logError }
}
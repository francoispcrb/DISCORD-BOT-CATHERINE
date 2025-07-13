const fs = require('fs');

function readJSON(path) {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf-8')) : {};
}

function writeJSON(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = {
    readJSON,
    writeJSON
};

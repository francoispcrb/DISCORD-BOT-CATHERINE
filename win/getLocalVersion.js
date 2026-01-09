module.exports = function getLocalVersion() {
  console.debug("📦 Checking version from local...");

  const { version, name } = require('../package.json');

  console.log(`📦 Nom : ${name}`);
  console.log(`🕒 Version locale : ${version}`);

  return version;
};

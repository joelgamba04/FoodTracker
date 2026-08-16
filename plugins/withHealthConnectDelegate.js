const { withMainActivity } = require("expo/config-plugins");

const IMPORT =
  "import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate";

const INIT = "HealthConnectPermissionDelegate.setPermissionDelegate(this)";

module.exports = function withHealthConnectDelegate(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes(IMPORT)) {
      const packageLineMatch = contents.match(/^package .+$/m);

      if (packageLineMatch) {
        contents = contents.replace(
          packageLineMatch[0],
          `${packageLineMatch[0]}\n\n${IMPORT}`,
        );
      }
    }

    if (!contents.includes(INIT)) {
      contents = contents.replace(
        "super.onCreate(null)",
        `super.onCreate(null)\n\n    ${INIT}`,
      );
    }

    config.modResults.contents = contents;

    return config;
  });
};

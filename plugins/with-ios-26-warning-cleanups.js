const { withAppDelegate, withInfoPlist } = require("@expo/config-plugins");

const linkingApiOverridePattern =
  /\n\s*\/\/ Linking API\s*\n\s*public override func application\(\s*\n\s*_ app: UIApplication,\s*\n\s*open url: URL,\s*\n\s*options: \[UIApplication\.OpenURLOptionsKey: Any\] = \[:\]\s*\n\s*\) -> Bool \{\s*\n\s*return super\.application\(app, open: url, options: options\) \|\| RCTLinkingManager\.application\(app, open: url, options: options\)\s*\n\s*\}\s*\n/;

module.exports = function withIos26WarningCleanups(config) {
  config = withInfoPlist(config, (config) => {
    delete config.modResults.UIRequiresFullScreen;
    return config;
  });

  return withAppDelegate(config, (config) => {
    if (config.modResults.language === "swift") {
      config.modResults.contents = config.modResults.contents.replace(
        linkingApiOverridePattern,
        "\n"
      );
    }

    return config;
  });
};

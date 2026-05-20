const { withAppBuildGradle } = require('@expo/config-plugins');

function withMLKitPose(config) {
  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    const deps = [
      `    implementation 'com.google.mlkit:pose-detection:18.0.0-beta5'`,
      `    implementation 'com.google.mlkit:pose-detection-accurate:18.0.0-beta5'`,
    ];

    if (!contents.includes('mlkit:pose-detection')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n${deps.join('\n')}`
      );
      mod.modResults.contents = contents;
    }

    return mod;
  });
}

module.exports = withMLKitPose;

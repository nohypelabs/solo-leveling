const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const KEEP_XML = `<?xml version="1.0" encoding="utf-8"?>
<!--
  Bottom-nav icons (Ionicons) and Rajdhani text are bundled by Metro into
  res/raw + res/drawable and referenced by NAME at runtime from JS
  (expo-font loadAsync). AGP resource shrinking cannot see JS references,
  so release builds strip them -> tofu boxes in the tab bar.
  This file pins them. Wildcards cover Metro's hashed asset names.
-->
<resources xmlns:tools="http://schemas.android.com/tools"
    tools:keep="@raw/ionicons*,@raw/rajdhani*,@drawable/ionicons*,@drawable/rajdhani*" />
`;

/**
 * Re-applies res/raw/keep.xml on every prebuild (android/ is generated, so a
 * hand-placed keep.xml alone would be wiped by `npx expo prebuild`).
 */
function withFontKeepXml(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const dir = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'raw',
      );
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(path.join(dir, 'keep.xml'), KEEP_XML);
      return mod;
    },
  ]);
}

module.exports = withFontKeepXml;

export default {
  expo: {
    name: "Solo Leveling Fitness",
    slug: "solo-leveling-fitness",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "sololeveling",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    extra: {
      eas: {
        projectId: "9ea2b8e5-22ae-4b1a-be97-b072b64c3769",
      },
    },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a0a",
    },
    ios: {
      bundleIdentifier: "com.nohypelabs.sololeveling",
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          "Solo Leveling needs camera access for AI pose detection during training.",
        NSLocationWhenInUseUsageDescription:
          "Solo Leveling tracks your location for bonus outdoor missions.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Solo Leveling needs background location for activity-based bonus missions.",
      },
    },
    android: {
      package: "com.nohypelabs.sololeveling",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0a0a",
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "ACTIVITY_RECOGNITION",
        "TRANSMIT_IR",
        "FOREGROUND_SERVICE",
        "WAKE_LOCK",
        "POST_NOTIFICATIONS",
        "SCHEDULE_EXACT_ALARM",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "./plugins/withMLKitPose",
      [
        "expo-camera",
        {
          cameraPermission:
            "Solo Leveling needs camera access for AI pose detection during training.",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Solo Leveling tracks your location for bonus outdoor missions.",
          locationAlwaysAndWhenInUsePermission:
            "Solo Leveling needs background location for activity-based bonus missions.",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#00f3ff",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResources: true,
          },
        },
      ],
    ],
  },
};
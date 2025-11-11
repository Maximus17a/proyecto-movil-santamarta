export default {
  name: "Farmacia Santa Marta",
  slug: "farmacia-santamarta", 
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "farmacia-santamarta",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#4ADE80"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.farmacia.santamarta",
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLName: "farmacia-santamarta",
          CFBundleURLSchemes: ["farmacia-santamarta"]
        }
      ],
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true
      }
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png", 
      backgroundColor: "#FFFFFF"
    },
    package: "com.farmacia.santamarta",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "auth.expo.io"
          },
          {
            scheme: "farmacia-santamarta"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-location"
  ]
};
/**
 * Bundle ID / package for native builds — required via env, no default.
 *
 * Every dev (and CI/EAS) must provide their own values so Xcode signing picks
 * their Apple team and no one accidentally ships someone else's bundle ID.
 *
 *   # .env.local
 *   IOS_BUNDLE_ID=com.yourname.rupta.dev
 *   ANDROID_PACKAGE=com.yourname.rupta.dev
 *
 * After changing, run `npx expo prebuild --clean` to regenerate `ios/` and `android/`.
 */
module.exports = ({ config }) => {
  const iosBundleId = process.env.IOS_BUNDLE_ID;
  const androidPackage = process.env.ANDROID_PACKAGE;

  if (!iosBundleId || !androidPackage) {
    throw new Error(
      'Missing IOS_BUNDLE_ID and/or ANDROID_PACKAGE env vars. ' +
        'Add them to .env.local (see app.config.js for details).',
    );
  }

  return {
    ...config,
    ios: { ...config.ios, bundleIdentifier: iosBundleId },
    android: { ...config.android, package: androidPackage },
  };
};

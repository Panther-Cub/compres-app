const path = require('node:path');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'assets/Vanilla.icns',
    extraResource: ['assets'],
    ignore: [
      /^\/src/,
      /^\/public/,
      /^\/scripts\/(?!postinstall|preinstall)/,
      /^\/\.git/,
      /^\/node_modules\/(?!ffmpeg-static|ffprobe-static)/,
      /^\/dist/,
      /^\/\.env/,
      /^\/README\.md/,
      /^\/tsconfig/,
      /^\/tailwind\.config/,
      /^\/postcss\.config/,
      /^\/package-lock\.json/,
      /^\/electron-builder/,
      /^\/forge\.config/,
      /^\/UNSIGNED_UPDATES\.md/,
      /^\/UPDATE_SYSTEM\.md/,
      /^\/RELEASE_NOTES/,
      /^\/setup-github\.md/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-pkg',
      config: {
        scripts: path.join(__dirname, 'scripts'),
        identity: null,
        hardenedRuntime: false,
        gatekeeperAssess: false,
        notarize: false
      }
    }
  ]
};

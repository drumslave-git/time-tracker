# WhaleSoft Time Tracker App

### Desktop app based on nodejs+electron

## Roadmap:
* ~~Add watermark for screenshots~~
* **Handle errors**
    * ~~Login error~~
    * Jira API errors
* **Handle async screenshots upload (when offline during tracking)**
* Create clearing services
    * ~~Server (remove unneeded imgs and data)~~ **Poorly tested feature**
    * ~~Clear local screenshots after successful upload~~
* ~~Fix screenshot start time~~
* **Fix screenshots duration**
* **Add user activity monitor**
    * ~~Turn off tracking in case of inactivity~~
    * Measure user activity level
* ~~Add subsystem to duplicate data (to make sure that user didn't manualy remove/add any data)~~
* **Protect source code**
* Make UI/UX better
* **Logs system**

## Notes:
To resolve SSL issue during npm install ``npm config set registry http://registry.npmjs.org/``

To resolve native module crash (robotjs) ``node-gyp rebuild --target=1.7.3 --arch=x64 --dist-url=https://atom.io/download/atom-shell --obi=50``
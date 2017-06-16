const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
    .then(createWindowsInstaller)
    .catch((error) => {
        console.error(error.message || error)
        process.exit(1)
    })

function getInstallerConfig () {
    console.log('creating windows installer')

    console.log(path.join(__dirname))
    return Promise.resolve({
        appDirectory: path.join(__dirname, 'release-builds','tracker-win32-ia32'),
        authors: 'Christian Engvall',
        noMsi: true,
        outputDirectory: path.join(__dirname, 'windows-installer'),
        // exe: 'Electron tutorial app.exe',
        // setupExe: 'ElectronTutorialAppInstaller.exe',
        setupIcon: path.join(__dirname, 'assets', 'imgs', '1496954252_challenge.ico')
    })
}
const permissions = require("nativescript-permissions")
const fileSystemModule = require("tns-core-modules/file-system")
const dest = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS).toString()

export function saveData(deviceName, binData){
  const name = deviceName + (new Date()).toISOString() + '.dat'
  const path = fileSystemModule.path.join(dest, name)

  return permissions.requestPermission([
    'android.permission.WRITE_EXTERNAL_STORAGE'
  ], 'Necessary for writing data file').then(() => {
    const dataFile = fileSystemModule.File.fromPath(path)

    return new Promise((resolve, reject) => {
      let error = null
      dataFile.writeSync(binData, (err) => {
        error = err
        reject(err)
      })

      if (!error) {
        resolve(name)
      }
    })
  })
}

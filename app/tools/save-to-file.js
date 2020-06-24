const platformModule = require("tns-core-modules/platform")
const permissions = require("nativescript-permissions")
const fileSystemModule = require("tns-core-modules/file-system")

function getFolder(){
  if (!platformModule.isAndroid){
    return ''
  }

  return android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS).toString()
}

const dest = getFolder()

export function saveData(deviceName, binData){
  if (!platformModule.isAndroid()){
    return Promise.reject(new Error('Not available on ios yet'))
  }

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

export function saveTextData(deviceName, text, extension = 'txt') {
  if (!platformModule.isAndroid()) {
    return Promise.reject(new Error('Not available on ios yet'))
  }

  const name = deviceName + (new Date()).toISOString() + '.' + extension
  const path = fileSystemModule.path.join(dest, name)

  return permissions.requestPermission([
    'android.permission.WRITE_EXTERNAL_STORAGE'
  ], 'Necessary for writing data file').then(() => {
    const dataFile = fileSystemModule.File.fromPath(path)

    return dataFile.writeText(text)
  })
}

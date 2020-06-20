export const SERVICE_UUID = '7b183224-9168-443e-a927-7aeea07e8105'

export const CHARACTERISTICS = Object.freeze({
  count: '292bd3d2-14ff-45ed-9343-55d125edb721',
  rw: '56cd7757-5f47-4dcd-a787-07d648956068',
  data: 'fec26ec4-6d71-4442-9f81-55bc21d658d6'
})

function toHex(ch){
  return Uint8Array.from([ch.charCodeAt(0)])
}

export const COMMANDS = Object.freeze({
  isWritingToFlash: {
    value: toHex('I'),
    notify: true,
    returnType: Uint8Array
  },
  getUptime: {
    value: toHex('A'),
    notify: true,
    returnType: Uint32Array
  },
  startWritingToFlash: {
    value: toHex('w'),
    returnType: Uint8Array
  },
  stopWritingToFlash: {
    value: toHex('s'),
    returnType: Uint8Array
  },
  recordPrimaryEncounterEvent: {
    value: toHex('M'),
    returnType: Uint8Array
  },
  recordSecondaryEncounterEvent: {
    value: toHex('U'),
    returnType: Uint8Array
  },
  startDataDownload: {
    value: toHex('f'),
    returnType: Uint8Array
  },
  stopDataDownload: {
    value: toHex('F'),
    returnType: Uint8Array
  }
})

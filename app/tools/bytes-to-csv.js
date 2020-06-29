const BLOCK_SIZE = 32 // bytes

function convertToCsv(data) {
  return JSON.stringify(data)
    .replace(/],\[/g, '\n')
    .replace(/]]/g, '')
    .replace(/\[\[/g, '')
    // in JSON, double quotes are escaped, but in CSV they need to be
    // escaped by another double quote
    .replace(/\\"/g, '""');
}

function isZero(n){ return n === 0 }

function data2hex(uint8array) {
  // https://stackoverflow.com/questions/40031688/javascript-arraybuffer-to-hex
  return Array.prototype.map.call(uint8array, x => ('00' + x.toString(16)).slice(-2)).join('');
}

function getDataFromView(arrayView){
  let first, last, epoch_minute, id, flag, flag2
  let mean37, n37, min37, max37, std237
  let mean38, n38, min38, max38, std238
  let mean39, n39, min39, max39, std239

  first = arrayView.getUint8(6)
  last = arrayView.getUint8(7)
  epoch_minute = arrayView.getUint32(8, true);
  let tz_offset_ms = new Date().getTimezoneOffset() * 60 * 1000;
  let d = new Date(epoch_minute * 60 * 1000 - tz_offset_ms) // 3600 * 6 * 1000)
  // console.log(d)
  let date_string = d.toISOString()
  date_string = date_string.split('.')
  date_string = date_string[0]
  id = new Uint8Array(arrayView.buffer, 12, BLOCK_SIZE) //arrayView.buffer.slice(12, 12 + 32)
  // console.log(id)
  id = data2hex(id)
  // console.log(id)

  let offset = 44
  mean37 = arrayView.getUint8(offset)
  n37 = arrayView.getUint8(offset + 1)
  min37 = arrayView.getUint8(offset + 2)
  max37 = arrayView.getUint8(offset + 3)
  std237 = arrayView.getUint16(offset + 4, true)

  offset = 50
  mean38 = arrayView.getUint8(offset)
  n38 = arrayView.getUint8(offset + 1)
  min38 = arrayView.getUint8(offset + 2)
  max38 = arrayView.getUint8(offset + 3)
  std238 = arrayView.getUint16(offset + 4, true)

  offset = 56
  mean39 = arrayView.getUint8(offset)
  n39 = arrayView.getUint8(offset + 1)
  min39 = arrayView.getUint8(offset + 2)
  max39 = arrayView.getUint8(offset + 3)
  std239 = arrayView.getUint16(offset + 4, true)
  flag = arrayView.getUint8(62)
  flag2 = arrayView.getUint8(63)

  let rssi = Math.min(mean37, mean38, mean39)

  return {
    date_string, epoch_minute, first, last,
    mean37, n37, min37, max37, std237,
    mean38, n38, min38, max38, std238,
    mean39, n39, min39, max39, std239,
    flag, flag2, id, rssi
  }
}

export function bytesToData(raw){
  const numBlocks = raw.byteLength / BLOCK_SIZE
  let last_mark = 0

  for (let index = 0; index < numBlocks; index++) {
    let view = new Uint32Array(raw.buffer, index * BLOCK_SIZE, BLOCK_SIZE / 4)

    if (view.every(isZero)) {
      last_mark = index
    }
  }

  let last_start = last_mark + 2

  let data = []

  for (let index = last_start; index < numBlocks; index += 2) {
    let row = new DataView(raw.buffer, index * BLOCK_SIZE, 2 * BLOCK_SIZE)
    let entry = getDataFromView(row)

    data.push(entry)
  }

  return data
}

export function bytesToCsv(raw) {
  // Should check that last_mark is < numBlocks
  let header = [
    'time', 'epoch_minute', 'first', 'last',
    'mean37', 'n37', 'min37', 'max37', 'var37',
    'mean38', 'n38', 'min38', 'max38', 'var38',
    'mean39', 'n39', 'min39', 'max39', 'var39',
    'flag', 'flag2', 'encounter_id'
  ]

  let data = bytesToData(raw)

  // Add checks before we add to file
  // 1.. Valid crypto flag==7
  // 2.. Duration is greater than >30 seconds
  //
  let rows = data.filter(entry => entry.flag === 7).map(entry => {
    return [
      entry.date_string, entry.epoch_minute, entry.first, entry.last,
      entry.mean37, entry.n37, entry.min37, entry.max37, entry.std237,
      entry.mean38, entry.n38, entry.min38, entry.max38, entry.std238,
      entry.mean39, entry.n39, entry.min39, entry.max39, entry.std239,
      entry.flag, entry.flag2, entry.id
    ]
  })

  rows.unshift(header)

  return convertToCsv(rows)
}

import StructSchema from './struct-schema'

const BLOCK_SIZE = 32 // bytes

const chData = new StructSchema([
  {
    key: 'mean',
    type: 'uint8',
    littleEndian: true
  },
  {
    key: 'n',
    type: 'uint8',
    littleEndian: true
  },
  {
    key: 'min',
    type: 'uint8',
    littleEndian: true
  },
  {
    key: 'max',
    type: 'uint8',
    littleEndian: true
  },
  {
    key: 'var',
    type: 'uint16',
    littleEndian: true
  },
])

const encounterRecord = new StructSchema([
  {
    key: 'mac',
    type: 'uint8',
    length: 6,
    littleEndian: true
  },
  {
    key: 'first_time',
    type: 'uint8',
    length: 1,
    littleEndian: true
  },
  {
    key: 'last_time',
    type: 'uint8',
    length: 1,
    littleEndian: true
  },
  {
    key: 'minute',
    type: 'uint32',
    length: 1,
    littleEndian: true
  },
  {
    key: 'public_key',
    type: 'uint8',
    length: 32,
    littleEndian: true
  },
  {
    key: 'rssi_data',
    type: chData,
    length: 3
  },
  {
    key: 'flag',
    type: 'uint8',
    length: 1,
    littleEndian: true
  },
  {
    key: 'flag2',
    type: 'uint8',
    length: 1,
    littleEndian: true
  }
])

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


function getDataFromView(arrayView) {
  let parsed = encounterRecord.read(arrayView)

  let tz_offset_ms = new Date().getTimezoneOffset() * 60 * 1000;
  let d = new Date(parsed.minute * 60 * 1000 - tz_offset_ms) // 3600 * 6 * 1000)
  let date_string = d.toISOString()
  date_string = date_string.split('.')
  date_string = date_string[0]

  let id = data2hex(parsed.public_key)

  let rssi = Math.min(...parsed.rssi_data.map(e => e.mean))

  let [mean37, n37, min37, max37, std237] = [parsed.rssi_data[0].mean, parsed.rssi_data[0].n, parsed.rssi_data[0].min, parsed.rssi_data[0].max, parsed.rssi_data[0].var]
  let [mean38, n38, min38, max38, std238] = [parsed.rssi_data[1].mean, parsed.rssi_data[1].n, parsed.rssi_data[1].min, parsed.rssi_data[1].max, parsed.rssi_data[1].var]
  let [mean39, n39, min39, max39, std239] = [parsed.rssi_data[2].mean, parsed.rssi_data[2].n, parsed.rssi_data[2].min, parsed.rssi_data[2].max, parsed.rssi_data[2].var]

  return {
    date_string,
    epoch_minute: parsed.minute,
    first: parsed.first_time,
    last: parsed.last_time,
    mean37, n37, min37, max37, std237,
    mean38, n38, min38, max38, std238,
    mean39, n39, min39, max39, std239,
    flag: parsed.flag, flag2: parsed.flag2,
    id, rssi
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

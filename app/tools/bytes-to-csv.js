import _toPairs from 'lodash/toPairs'
import _isObject from 'lodash/isObject'
import _startCase from 'lodash/startCase'
import _get from 'lodash/get'
import StructSchema from './struct-schema'

const BLOCK_SIZE = 32 // bytes

const uSound = new StructSchema([
  {
    key: 'left',
    type: 'uint16',
    littleEndian: true
  },
  {
    key: 'left_iqr',
    type: 'uint16',
    littleEndian: true
  },
  {
    key: 'right',
    type: 'uint16',
    littleEndian: true
  },
  {
    key: 'right_iqr',
    type: 'uint16',
    littleEndian: true
  },
  {
    key: 'n',
    type: 'uint8',
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
    key: 'minute',
    type: 'uint32',
    length: 1,
    littleEndian: true
  },
  {
    key: 'version',
    type: 'uint8',
    length: 1,
    littleEndian: true
  },
  {
    key: 'usound_data',
    type: uSound,
    length: 1,
    littleEndian: true
  },
  {
    key: 'rssi_values',
    type: 'int8',
    length: 12
  },
  {
    key: 'public_key',
    type: 'uint8',
    length: 32,
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


function getCSVData(data) {

  let rssi = Math.min(...data.rssi_data.map(e => e.mean))

  let [mean37, n37, min37, max37, std237] = [data.rssi_data[0].mean, data.rssi_data[0].n, data.rssi_data[0].min, data.rssi_data[0].max, data.rssi_data[0].var]
  let [mean38, n38, min38, max38, std238] = [data.rssi_data[1].mean, data.rssi_data[1].n, data.rssi_data[1].min, data.rssi_data[1].max, data.rssi_data[1].var]
  let [mean39, n39, min39, max39, std239] = [data.rssi_data[2].mean, data.rssi_data[2].n, data.rssi_data[2].min, data.rssi_data[2].max, data.rssi_data[2].var]

  return {
    date_string: data.timestamp,
    epoch_minute: data.minute,
    first: data.first_time,
    last: data.last_time,
    mean37, n37, min37, max37, std237,
    mean38, n38, min38, max38, std238,
    mean39, n39, min39, max39, std239,
    flag: data.flag, flag2: data.flag2,
    id: data.clientKey, rssi
  }
}

function getDataFromView(arrayView) {
  let parsed = encounterRecord.read(arrayView)

  let tz_offset_ms = new Date().getTimezoneOffset() * 60 * 1000;
  let d = new Date(parsed.minute * 60 * 1000 - tz_offset_ms) // 3600 * 6 * 1000)
  let timestamp = d.toISOString()
  timestamp = timestamp.split('.')
  timestamp = timestamp[0]

  let clientKey = data2hex(parsed.public_key)

  return {
    ...parsed,
    timestamp,
    clientKey
  }
}

export function bytesToData(raw){
  const numBlocks = raw.byteLength / BLOCK_SIZE
  let last_mark = 0

  // for (let index = 0; index < numBlocks; index++) {
  //   let view = new Uint32Array(raw.buffer, index * BLOCK_SIZE, BLOCK_SIZE / 4)

  //   if (view.every(isZero)) {
  //     last_mark = index
  //   }
  // }

  let last_start = last_mark + 2

  let data = []

  for (let index = last_start; index < numBlocks - 1; index += 2) {
    let row = new DataView(raw.buffer, index * BLOCK_SIZE, 2 * BLOCK_SIZE)
    let entry = getDataFromView(row)

    data.push(entry)
  }

  return data
}

function getPaths(obj){
  return _toPairs(obj).reduce((ret, [key, value]) => {
    if (_isObject(value)) {
      return ret.concat(getPaths(obj).map(k => key + '.' + k))
    }

    ret.push(key)
    return ret
  }, [])
}

export function bytesToCsv(raw) {
  // Should check that last_mark is < numBlocks
  let data = bytesToData(raw).map(getCSVData)

  let paths = getPaths(data[0])
  let header = paths.map(_startCase)
  let rows = data.map(entry =>
    paths.map(p => _get(entry, p))
  )

  rows.unshift(header)
  return convertToCsv(rows)
}

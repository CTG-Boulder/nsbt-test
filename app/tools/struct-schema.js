const PRIMITIVES = {
  'uint8': {
    getter: (dataview, prop, byteOffset) => dataview.getUint8(byteOffset, prop.littleEndian),
    byteSize: 1
  },
  'uint16': {
    getter: (dataview, prop, byteOffset) => dataview.getUint16(byteOffset, prop.littleEndian),
    byteSize: 2
  },
  'uint32': {
    getter: (dataview, prop, byteOffset) => dataview.getUint32(byteOffset, prop.littleEndian),
    byteSize: 4
  },
  'int8': {
    getter: (dataview, prop, byteOffset) => dataview.getInt8(byteOffset, prop.littleEndian),
    byteSize: 1
  },
  'int16': {
    getter: (dataview, prop, byteOffset) => dataview.getInt16(byteOffset, prop.littleEndian),
    byteSize: 2
  },
  'int32': {
    getter: (dataview, prop, byteOffset) => dataview.getInt32(byteOffset, prop.littleEndian),
    byteSize: 4
  },
  'float32': {
    getter: (dataview, prop, byteOffset) => dataview.getFloat32(byteOffset, prop.littleEndian),
    byteSize: 4
  },
  'float64': {
    getter: (dataview, prop, byteOffset) => dataview.getFloat64(byteOffset, prop.littleEndian),
    byteSize: 8
  }
}

export default class StructSchema {
  constructor(schema){
    this._totalBytes = 0
    this._props = []

    for (let entry of schema){
      this.addProp(entry)
    }
  }

  addProp( entry ){
    let { key, type, length = 1, littleEndian = false } = entry

    if (this._props.some(e => e.key === key)){
      throw new Error(`Property with key name "${key}" already defined`)
    }

    let byteOffset = this._totalBytes
    let def
    if ( type instanceof StructSchema ){
      def = {
        getter: (view, prop, byteOffset) => type.read(new DataView(view.buffer, view.byteOffset + byteOffset, prop.byteSize)),
        byteSize: type._totalBytes
      }
    } else {
      def = PRIMITIVES[type]
    }

    if (!def){
      throw new Error(`Type "${type}" not valid.`)
    }

    let { getter, byteSize } = def

    let totalBytes = byteSize * length
    let prop = Object.freeze({
      key,
      type,
      length,
      littleEndian,
      byteSize: byteSize,
      totalBytes: totalBytes,
      read(view){
        let data = []
        for (let i = 0; i < length; i++){
          data[i] = getter(view, prop, byteOffset + byteSize * i)
        }
        return data
      }
    })

    this._totalBytes += totalBytes
    this._props.push(prop)
  }

  read(bufferOrView){
    let ret = {}

    let view = bufferOrView
    if (!(bufferOrView instanceof DataView)){
      view = new DataView(bufferOrView)
    }

    for (let prop of this._props){
      let data = prop.read(view)
      if (prop.length === 1){
        data = data[0]
      }
      ret[prop.key] = data
    }

    return ret
  }
}

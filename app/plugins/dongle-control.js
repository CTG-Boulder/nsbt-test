import Vue from 'nativescript-vue'
import { SERVICE_UUID, CHARACTERISTICS, COMMANDS } from '../config'
import { bluetooth } from './bluetooth-service'
import sanitize from 'sanitize-filename'

const COMMAND_TIMEOUT = 5000
const noop = () => {}

function toBtValue(val){
  if (typeof val === 'number'){
    let buf = new ArrayBuffer(4)
    let view = new DataView(buf)
    view.setUint32(0, val, true)
    return new Uint8Array(buf)
  }

  if (typeof val === 'string'){
    return Uint8Array.of(val.charCodeAt(0))
  }

  throw new Error('Can not encode value for bluetooth write')
}

export class OutOfOrderException extends Error {
  constructor(){
    super('Received block out of order')
  }
}

export class InterruptException extends Error {
  constructor(){
    super('Interrupted')
  }
}

function Controller(){
  // just using vue for events
  const pubsub = new Vue()
  let subscribed = false
  let connection = null
  let notifyCallback = noop

  function assertConnection(){
    if (!connection){
      throw new Error('No connection established')
    }
  }

  async function disconnect(){
    if (!connection){ return }
    unsubscribe()
    await bluetooth.disconnect({
      UUID: connection.UUID
    })
    connection = null
  }

  async function connect({ UUID } = {}) {
    if (!UUID){
      throw new Error('Invalid UUID specified')
    }
    await disconnect()
    connection = await bluetooth.connect({
      UUID,
      onDisconnected: () => {
        connection = null
        pubsub.$emit('disconnected')
      }
    })

    subscribe()
    pubsub.$emit('connected', connection)
  }

  async function subscribe(){
    assertConnection()
    if (subscribed) { return }
    await bluetooth.startNotifying({
      peripheralUUID: connection.UUID,
      serviceUUID: SERVICE_UUID,
      characteristicUUID: CHARACTERISTICS.data,
      onNotify: (res) => {
        notifyCallback(res)
        notifyCallback = noop
      }
    })

    subscribed = true
  }

  async function unsubscribe(){
    assertConnection()
    if (!subscribed) { return }
    await bluetooth.stopNotifying({
      peripheralUUID: connection.UUID,
      serviceUUID: SERVICE_UUID,
      characteristicUUID: CHARACTERISTICS.data
    })

    subscribed = false
  }

  async function getMemoryUsage(){
    assertConnection()

    let res = await bluetooth.read({
      peripheralUUID: connection.UUID,
      serviceUUID: SERVICE_UUID,
      characteristicUUID: CHARACTERISTICS.count
    })

    let data = new Uint32Array(res.value)
    return data[0]
  }

  function sendCommand(name){
    const command = COMMANDS[name]

    if (!command){
      return Promise.reject(new Error('No command named: ' + name))
    }

    return new Promise((resolve, reject) => {
      assertConnection()

      let timeout = setTimeout(() => {
        notifyCallback = noop
        reject(new Error('Command timed out before receiving response via notify'))
      }, COMMAND_TIMEOUT)

      function done(res) {
        clearTimeout(timeout)
        notifyCallback = noop

        try {
          let data = res && res.value ?
            new command.returnType(res.value) :
            []
          resolve(data)
        } catch(err){
          reject(err)
        }
      }

      if (command.notify){
        notifyCallback = done
      }

      bluetooth.write({
        peripheralUUID: connection.UUID,
        serviceUUID: SERVICE_UUID,
        characteristicUUID: CHARACTERISTICS.rw,
        value: toBtValue(command.value)
      }).then(res => {
        if (!command.notify){
          done(res)
        }
      }).catch(err => {
        notifyCallback = noop
        reject(err)
      })

    })
  }

  async function setName(name){
    assertConnection()
    if (name.length > 8){
      throw new Error('Name must be less than 8 characters')
    }

    let value = new Uint8Array(8)
    for (let i = 0; i < name.length; i++){
      value[i] = name.charCodeAt(i)
    }

    await sendCommand('setName')

    await bluetooth.writeWithoutResponse({
      peripheralUUID: connection.UUID,
      serviceUUID: SERVICE_UUID,
      characteristicUUID: CHARACTERISTICS.data,
      value: value
    })
  }

  async function fetchData(opts = { interrupt: false, onProgress }){
    assertConnection()

    const blocksTotal = await getMemoryUsage()
    const blockSize = 32
    const expectedLength = blocksTotal * blockSize

    let blocksReceived = 0
    let bytesReceived = 0
    let expectedMTUSize = 0
    let result = new Uint8Array(expectedLength)

    // console.log('expecting bytes', expectedLength)

    function nextBlock(){
      return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
          if (opts.interrupt){
            clearInterval(interval)
            notifyCallback = noop;
            reject(new InterruptException())
          }
        }, 1000)
        notifyCallback = (res) => {
          let blockNumber = new Uint32Array(res.value, 0, 1)[0]
          let block = new Uint8Array(res.value, 4)

          // console.log(blockNumber, block.byteLength, block)

          if (block.byteLength === 0){
            // drop value
            blocksReceived++
            return resolve(false)
          }

          if (blockNumber !== blocksReceived){
            return reject(new OutOfOrderException())
          }

          if (!expectedMTUSize){
            expectedMTUSize = block.byteLength
          }

          // if (block.byteLength !== expectedMTUSize){
          //   return reject(new Error('Incorrect block size received'))
          // }

          result.set(block, bytesReceived)
          notifyCallback = noop
          bytesReceived += block.byteLength
          blocksReceived++
          resolve(true)
        }

        bluetooth.writeWithoutResponse({
          peripheralUUID: connection.UUID,
          serviceUUID: SERVICE_UUID,
          characteristicUUID: CHARACTERISTICS.data_req,
          value: toBtValue(blocksReceived)
        }).catch(err => {
          reject(err)
        })
      })
    }

    try {
      await sendCommand('startDataDownload')

      while(bytesReceived < expectedLength){
        if (opts.interrupt){
          throw new InterruptException()
        }

        try {
          await nextBlock()
        } catch (e){
          throw e
          // if it's out of order block, try again
          // if (!(e instanceof OutOfOrderException)){
          //   throw e
          // }
        }
        if (opts.onProgress){
          opts.onProgress(bytesReceived, expectedLength)
        }
      }

    } catch (err){
      throw err
    } finally {
      await sendCommand('stopDataDownload')
    }

    return result
  }

  return {
    connect,
    disconnect,
    getMemoryUsage,
    sendCommand,
    setName,
    fetchData,
    getDeviceName: () => sanitize(connection.localName),
    isConnected: () => !!connection,
    on: pubsub.$on.bind(pubsub),
    off: pubsub.$off.bind(pubsub),
    once: pubsub.$once.bind(pubsub)
  }
}

export default {
  install(Vue) {
    Vue.prototype.$dongle = Controller()
  }
}

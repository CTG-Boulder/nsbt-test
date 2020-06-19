import Vue from 'nativescript-vue'
import { SERVICE_UUID, CHARACTERISTICS, COMMANDS } from '../config'
import { bluetooth } from './bluetooth-service'

const COMMAND_TIMEOUT = 5000
const noop = () => {}

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
    pubsub.$emit('connected')
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

        console.log(res.value.byteLength)
        try {
          let data = res.value ?
            new command.returnType(res.value) :
            []
          resolve(data)
        } catch(err){
          reject(err)
        }
      }

      notifyCallback = done
      bluetooth.write({
        peripheralUUID: connection.UUID,
        serviceUUID: SERVICE_UUID,
        characteristicUUID: CHARACTERISTICS.rw,
        value: command.value
      }).catch(err => {
        notifyCallback = noop
        reject(err)
      })

    })
  }

  return {
    connect,
    disconnect,
    getMemoryUsage,
    sendCommand,
    getDeviceName: () => connection.localName,
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

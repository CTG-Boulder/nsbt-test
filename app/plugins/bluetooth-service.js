import { Bluetooth } from "nativescript-bluetooth"
export const bluetooth = new Bluetooth()

export default {
  install(Vue) {
    const pubsub = new Vue()

    let hasBluetooth = false
    async function check() {
      let res = await bluetooth.isBluetoothEnabled()

      if (res !== hasBluetooth){
        hasBluetooth = res
        pubsub.$emit('bluetooth', hasBluetooth)
      }
    }

    setInterval(check, 1000)
    check()

    Vue.prototype.$bluetooth = bluetooth
    Vue.prototype.$onBtStatusChange = function(fn){
      pubsub.$on('bluetooth', fn)
      this.$on('hook:beforeDestroy', () => {
        pubsub.$off('bluetooth', fn)
      })
    }
  }
}

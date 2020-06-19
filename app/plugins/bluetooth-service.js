import { Bluetooth } from "nativescript-bluetooth"

export const bluetooth = new Bluetooth()

export default {
  install(Vue) {
    Vue.prototype.$bluetooth = bluetooth
  }
}

import Vue from 'nativescript-vue'
import Welcome from './pages/Welcome'
import VueDevtools from 'nativescript-vue-devtools'
import BluetoothService from './plugins/bluetooth-service'
import DongleControl from './plugins/dongle-control'

if(TNS_ENV !== 'production') {
  // Change this ip address to your host machine
  Vue.use(VueDevtools, { host: '192.168.1.7', port: 8098 })
}

Vue.use(BluetoothService)
Vue.use(DongleControl)

Vue.registerElement(
  'PullToRefresh',
  () => require('@nstudio/nativescript-pulltorefresh').PullToRefresh
)

// Prints Vue logs when --env.production is *NOT* set while building
Vue.config.silent = (TNS_ENV === 'production')


new Vue({

  render: h => h('frame', [h(Welcome)])
}).$start()

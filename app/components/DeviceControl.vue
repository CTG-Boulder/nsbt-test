<template>
<StackLayout>
  <Label :text="`Memory used: ${memoryUsage} blocks`" />
  <Button text="Refresh Memory Usage" @tap="getMemoryUsage" />
  <Label :text="`Writing to Flash?: ${flashWriteText}`" />
  <Button text="Check Flash" @tap="checkFlashUsage" />

  <Label :text="`Uptime?: ${uptime[0]} ${uptime[1]}`" />
  <Button text="Get uptime" @tap="getUptime" />
  <!-- <HtmlView :html="`<pre>${JSON.stringify(memoryUsage, null, 4)}</pre>`" /> -->
</StackLayout>
</template>

<script>
import { SERVICE_UUID, CHARACTERISTICS, COMMANDS } from '../config'
const COMMAND_TIMEOUT = 5000

export default {
  name: 'DeviceControl',
  inject: [ 'bluetooth' ],
  props: {
    device: Object
  },
  data() {
    return {
      subscribed: false,
      memoryUsage: 'unknown',
      flashWrite: 'unknown',
      uptime: 0
    }
  },

  watch: {
    device: {
      handler(device, oldDevice){
        this.unsubscribe(oldDevice)
        if (!this.device){ return }
        this.subscribe()
      },
      immediate: true
    }
  },

  mounted(){
    // this.getMemoryUsage()
  },

  beforeDestroy(){
    this.unsubscribe()
  },

  computed: {
    flashWriteText(){
      return this.flashWrite === 'unknown' ?
        this.flashWrite :
        this.flashWrite ? 'Yes' : 'No'
    }
  },

  methods: {
    onButtonTap(){},

    getMemoryUsage(){
      return this.bluetooth.read({
        peripheralUUID: this.device.UUID,
        serviceUUID: SERVICE_UUID,
        characteristicUUID: CHARACTERISTICS.count
      }).then(res => {
        let data = new Uint32Array(res.value)
        this.memoryUsage = data[0]
        this.$emit('data', data)
      }).catch(err => {
        this.$emit('error', err)
      })
    },

    checkFlashUsage(){
      this.sendCommand(COMMANDS.isWritingToFlash).then((used) => {
        this.flashWrite = used[0]
      }).catch((err) => {
        this.$emit('error', err)
      })
    },

    getUptime(){
      this.sendCommand(COMMANDS.getUptime).then((used) => {
        this.uptime = [used[0], used[1]]
      }).catch((err) => {
        this.$emit('error', err)
      })
    },

    sendCommand(command){
      return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
          this.$off('notify', done)
          reject(new Error('Command timed out before receiving response via notify'))
        }, COMMAND_TIMEOUT)

        function done(e){
          clearTimeout(timeout)
          let data = new command.returnType(e.value)
          resolve(data)
        }

        this.$once('notify', done)
        this.bluetooth.write({
          peripheralUUID: this.device.UUID,
          serviceUUID: SERVICE_UUID,
          characteristicUUID: CHARACTERISTICS.rw,
          value: command.value
        }).then(res => {
          this.$emit('response', res)
          // let data = new Uint16Array(res.value)
          // this.$emit('data', data)
        }).catch(err => {
          this.$off('notify', done)
          this.$emit('error', err)
          reject(err)
        })
      })
    },

    subscribe(){
      if (this.subscribed){ return }
      return this.bluetooth.startNotifying({
        peripheralUUID: this.device.UUID,
        serviceUUID: SERVICE_UUID,
        characteristicUUID: CHARACTERISTICS.data,
        onNotify: (res) => {
          this.$emit('notify', res)
        }
      }).then(() => {
        this.subscribed = true
      }).catch(err => {
        this.$emit('error', err)
      })
    },

    unsubscribe(device){
      device = device || this.device
      if (!this.subscribed){ return }
      return this.bluetooth.stopNotifying({
        peripheralUUID: device.UUID,
        serviceUUID: SERVICE_UUID,
        characteristicUUID: CHARACTERISTICS.data
      }).then(() => {
        this.subscribed = false
      }).catch(err => {
        this.$emit('error', err)
      })
    }
  }
}
</script>

<style scoped>
StackLayout {
  margin: 20 0;
  padding: 0;
}
Label {
  padding: 0 20;
}
</style>

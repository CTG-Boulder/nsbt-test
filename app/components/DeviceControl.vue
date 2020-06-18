<template>
<StackLayout>
  <Button text="Button" @tap="getMemoryUsage" />
  <HtmlView :html="`<pre>${JSON.stringify(memoryUsage, null, 4)}</pre>`" />
</StackLayout>
</template>

<script>
import { SERVICE_UUID, CHARACTERISTICS } from '../config'

export default {
  name: 'DeviceControl',
  inject: [ 'bluetooth' ],
  props: {
    device: Object
  },
  data() {
    return {
      memoryUsage: 'unknown'
    }
  },
  mounted(){
    // this.getMemoryUsage()
  },
  methods: {
    onButtonTap(){},

    getMemoryUsage(){
      this.bluetooth.read({
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
    }
  }
}
</script>

<style scoped>
</style>

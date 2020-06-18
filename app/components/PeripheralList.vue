<template>
  <PullToRefresh
    @refresh="refreshList"
  >
    <ListView ref="phList" for="item in peripherals"  @itemTap="onPeripheralTap">
      <v-template>
          <!-- Shows the list item label in the default color and style. -->
          <Label :text="item.UUID + ' | ' + item.localName" />
      </v-template>
    </ListView>
  </PullToRefresh>
</template>

<script>
import _find from 'lodash/find'

export default {
  name: 'PeripheralList',
  inject: [ 'bluetooth' ],
  props: {
    services: Array
  },
  data() {
    return {
      scanning: false,
      peripherals: []
    }
  },
  async mounted(){
    let hasBluetooth = await this.bluetooth.isBluetoothEnabled()

    if (hasBluetooth){
      this.scan()
    } else {
      this.$emit('error', new Error('Bluetooth not enabled'))
    }
  },

  methods: {
    async refreshList(args){
      const pullRefresh = args.object
      await this.scan()
      pullRefresh.refreshing = false
      this.$refs.phList.refresh()
    },
    scan(){
      this.peripherals = []
      this.bluetooth.startScanning({
        serviceUUIDs: this.services,
        seconds: 4,
        onDiscovered: (peripheral) => {
          this.addDiscovered(peripheral)
        },
        skipPermissionCheck: false,
      }).then(() => {
      }, (err) => {
        this.$emit('error', err)
      })
    },
    addDiscovered(peripheral){
      if(_find(this.peripherals, ['UUID', peripheral.UUID])) { return }
      this.peripherals.push(peripheral)
    },
    onPeripheralTap(e){
      this.$emit('peripheralTap', e.item)
    }
  }
}
</script>

<style scoped>
</style>

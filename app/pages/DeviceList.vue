<template>
  <Page>
    <ActionBar title="Devices">

    </ActionBar>
    <GridLayout>
      <ActivityIndicator :busy="busy" />
      <PeripheralList :services="services" @peripheralTap="onPeripheralTap" @error="onError"/>
    </GridLayout>

  </Page>
</template>

<script>
import { SERVICE_UUID } from '../config'
import PeripheralList from '../components/PeripheralList'
import DeviceControl from './DeviceControl'

export default {
  name: 'DeviceList',
  components: {
    PeripheralList
  },
  data() {
    return {
      busy: false,
      services: [SERVICE_UUID]
    }
  },
  methods: {
    async onPeripheralTap(ph){
      this.busy = true
      await this.$dongle.connect( ph )
      this.busy = false
      this.toDeviceControl()
    },
    toDeviceControl(){
      this.$navigateTo(DeviceControl)
    },
    onError(err){
      console.error(err)
    }
  }
}
</script>

<style scoped>
</style>

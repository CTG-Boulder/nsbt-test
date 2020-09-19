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
import { BROADCASTED_SERVICE_UUID } from '../config'
import Welcome from './Welcome'
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
      services: [BROADCASTED_SERVICE_UUID]
    }
  },
  mounted(){
    this.$onBtStatusChange((enabled) => {
      if (!enabled){
        this.$navigateTo(Welcome)
      }
    })
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
      this.$handleError(err)
    }
  }
}
</script>

<style scoped>
</style>

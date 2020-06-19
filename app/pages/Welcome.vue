<template>
  <Page>
    <ActionBar title="Welcome" />
    <StackLayout>
      <Label class="bt-warn" v-show="!hasBluetooth" textWrap="true" text="Please enable bluetooth on your device" />
      <Button v-show="hasBluetooth" class="btn-connect" text="Connect to Encounter Device" @tap="toDeviceList" />
    </StackLayout>
  </Page>
</template>

<script>
import DeviceList from './DeviceList'

export default {
  name: 'Welcome',
  components: {
  },
  data() {
    return {
      hasBluetooth: false
    }
  },

  async mounted(){
    this.hasBluetooth = await this.$bluetooth.isBluetoothEnabled()
    this.$onBtStatusChange((enabled) => {
      this.hasBluetooth = enabled
    })
  },

  methods: {
    toDeviceList(){
      this.$navigateTo(DeviceList)
    }
  }
}
</script>

<style scoped>
StackLayout {
  padding: 20;
}
.btn-connect {
  color: rgb(239, 255, 238);
  background: rgb(80, 191, 93);
}
.bt-warn {
  font-size: 26;
  color: #0000aa;
}
</style>

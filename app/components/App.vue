<template>
  <Page>
    <ActionBar :title="connection ? 'Connected to ' + connection.localName : 'Devices'">
      <ActionItem
        @tap="disconnect(connection)"
        v-show="connection"
        text="disconnect"
        ios.systemIcon="2"
        ios.position="right"
        android.systemIcon="presence_online"
      />
      <ActionItem
        v-show="!connection"
        ios.systemIcon="3"
        ios.position="right"
        android.systemIcon="presence_offline"
      />
    </ActionBar>
    <StackLayout>
      <PeripheralList v-show="!connection" :services="services" @peripheralTap="onPeripheralTap" @error="error = $event"/>
      <DeviceControl v-show="connection" :device="connection" @error="error = $event" />
    </StackLayout>
  </Page>
</template>

<script>
import PeripheralList from './PeripheralList'
import DeviceControl from './DeviceControl'

export default {
  name: 'App',
  components: {
    PeripheralList,
    DeviceControl
  },
  data() {
    return {
    }
  },
  watch: {
  },
  methods: {
    async onPeripheralTap(ph){
      await this.$dongle.connect( ph )
    }
  }
}
</script>

<style scoped>
  ActionBar {
    background-color: #53ba82;
    color: #ffffff;
  }

  .message {
    vertical-align: center;
    text-align: center;
    font-size: 20;
    color: #333333;
  }
</style>

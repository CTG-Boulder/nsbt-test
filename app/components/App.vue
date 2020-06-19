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
import { Bluetooth } from "nativescript-bluetooth"
import { SERVICE_UUID } from '../config'

const bluetooth = new Bluetooth()

export default {
  name: 'App',
  provide: {
    bluetooth
  },
  components: {
    PeripheralList,
    DeviceControl
  },
  data() {
    return {
      services: [SERVICE_UUID],
      error: null,
      connection: null
    }
  },
  beforeDestroy(){
    if (this.connection){
      this.disconnect(this.connection)
    }
  },
  watch: {
  },
  methods: {
    async onPeripheralTap(ph){
      if ( this.connection ){
        await this.disconnect(this.connection)
      }

      await this.connect( ph )
    },
    disconnect(ph){
      if (!ph){ return }
      return bluetooth.disconnect({
        UUID: ph.UUID
      }).then(() => {
        this.connection = null
        // success
      }, (err) => {
        this.error = err
      })
    },
    async connect(ph){
      bluetooth.connect({
        UUID: ph.UUID,
        onConnected: (peripheral) => {
          this.connection = peripheral
        },
        onDisconnected: () => {
          this.connection = null
        }
      })
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

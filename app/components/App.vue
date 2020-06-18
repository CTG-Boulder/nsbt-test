<template>
  <Page>
    <ActionBar title="Devices">
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

    <PeripheralList :services="services" @peripheralTap="onPeripheralTap" @error="error = $event"/>

  </Page>
</template>

<script>
import PeripheralList from './PeripheralList'
import _find from 'lodash/find'
import { Bluetooth } from "nativescript-bluetooth"

const bluetooth = new Bluetooth()
const SERVICE_UUID = '7b183224-9168-443e-a927-7aeea07e8105'

export default {
  name: 'App',
  provide: {
    bluetooth
  },
  components: {
    PeripheralList
  },
  data() {
    return {
      services: [SERVICE_UUID],
      error: null,
      connection: null
    }
  },
  watch: {
  },
  methods: {
    async onPeripheralTap(ph){
      if ( this.connection ){
        await this.disconnect(this.connection.UUID)
      }

      await this.connect( ph )
    },
    disconnect(ph){
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

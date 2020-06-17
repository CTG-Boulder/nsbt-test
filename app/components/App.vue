<template>
  <Page>
    <ActionBar title="Welcome to NativeScript-Vue!"/>
    <GridLayout columns="*" rows="*">
      <Label class="message" text="Devices discovered" col="0" row="0"/>
    </GridLayout>
    <ListView for="item in peripherals">
      <v-template>
        <!-- Shows the list item label in the default color and style. -->
        <Label :text="item.UUID" />
      </v-template>
    </ListView>
  </Page>
</template>

<script>
import { Bluetooth } from "nativescript-bluetooth"

const bluetooth = new Bluetooth()


export default {
  data() {
    return {
      msg: 'Hello World!',
      hasBluetooth: false,
      scanning: false,
      error: null,
      peripherals: []
    }
  },
  async mounted(){
    this.hasBluetooth = await bluetooth.isBluetoothEnabled()

    if (this.hasBluetooth){
      this.scan()
    }
  },
  methods: {
    scan(){
      this.peripherals = []
      this.scanning = true
      bluetooth.startScanning({
        serviceUUIDs: [],
        seconds: 4,
        onDiscovered: (peripheral) => {
          this.addDiscovered(peripheral)
        },
        skipPermissionCheck: false,
      }).then(() => {
        this.scanning = false
      }, (err) => {
        this.error = err
      })
    },
    addDiscovered(peripheral){
      this.peripherals.push(peripheral)
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

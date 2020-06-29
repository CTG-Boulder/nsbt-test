<template>
  <Page>
  <ScrollView>
    <ActionBar :title="`Connected to ${deviceName}`" />
    <StackLayout class="main">
      <StackLayout v-show="doingRename" >
        <Label text="New name:" />
        <TextField v-model="newDeviceName" maxLength="8" @returnPress="renameDevice"/>
        <FlexboxLayout class="buttons" orientation="horizontal">
          <Button flexGrow="1" text="Cancel" @tap="doingRename = false" />
          <Button flexGrow="1" class="btn-green" text="Save" @tap="renameDevice" />
        </FlexboxLayout>
      </StackLayout>

      <StackLayout v-show="!doingRename" >
        <FlexboxLayout class="buttons" orientation="horizontal">
          <Button flexGrow="1" text="Refresh" @tap="fetchData" />
          <Button flexGrow="1" class="btn-red" text="Disconnect" @tap="disconnect" />
        </FlexboxLayout>

        <Label :text="`Uptime: ${uptimeText}`" />

        <Label :text="`Memory used: ${memoryUsage} blocks`" />

        <StackLayout orientation="horizontal">
          <Label verticalAlignment="center" :text="`Recording Encounters?: ${flashWriteText}`" />
          <!-- <Switch :checked="flashWrite === 1" @checkedChange="toggleFlash"/> -->
        </StackLayout>
        <Button v-show="flashWrite === 0" class="btn-green" text="Start Recording Encounters" @tap="toggleFlash" />
        <Button v-show="flashWrite === 1" class="btn-red" text="Stop Recording" @tap="toggleFlash" />

        <Button v-show="!recordedPrimary && flashWrite === 1" text="I am near someone" @tap="recordPrimary" />
        <Button v-show="recordedPrimary && flashWrite === 1" class="btn-alone" text="I am alone now" @tap="recordSecondary" />

        <Label v-show="msg" class="msg" :text="msg" />
        <ActivityIndicator :busy="busy" />
        <StackLayout class="divider" />

        <Button v-show="flashWrite === 0" class="btn-red  -rounded-lg" text="erase flash" @tap="eraseFlash" />
        <Button v-show="!doingRename" text="Rename Device" isHidden="true" isEnabled="false" @tap="doingRename = true" />

        <Button v-show="!progress" text="Save Data File" isEnabled="true" @tap="saveDataFile" />
        <Button v-show="progress" text="Cancel" isEnabled="true" @tap="cancelDataFetch" />
        <StackLayout v-show="progress" class="pad">
          <Label class="msg" text="Downloading" />
          <Progress :value="progress" />
        </StackLayout>
      </StackLayout>

      <!-- <HtmlView :html="`<pre>${JSON.stringify(memoryUsage, null, 4)}</pre>`" /> -->
    </StackLayout>
  </ScrollView>
  </Page>
</template>

<script>
import Welcome from './Welcome'
import { saveTextData } from '../tools/save-to-file'
import { bytesToCsv, parse_binary } from '../tools/bytes-to-csv'
import { InterruptException } from '../plugins/dongle-control'

function msToTime(s) {
  var ms = s % 1000
  s = (s - ms) / 1000
  var secs = s % 60
  s = (s - secs) / 60
  var mins = s % 60
  var hrs = (s - mins) / 60

  return hrs + 'h ' + mins + 'm ' + secs + '.' + ms + 's'
}

export default {
  name: 'DeviceControl',

  data() {
    return {
      busy: false,
      progress: 0,
      doingRename: false,
      connected: false,
      recordedPrimary: false,
      deviceName: '',
      newDeviceName: '',
      memoryUsage: 'unknown',
      flashWrite: 'unknown',
      uptime: 0,
      msg: null
    }
  },

  mounted(){
    const connected = () => {
      this.connected = true
      this.deviceName = this.$dongle.getDeviceName()
    }
    const disconnected = () => {
      this.connected = false
    }

    this.$dongle.on('connected', connected)
    this.$dongle.on('disconnected', disconnected)
    this.connected = this.$dongle.isConnected()
    if (this.connected){ connected() }

    this.$on('hook:beforeDestroy', () => {
      this.$dongle.off('connected', connected)
      this.$dongle.off('disconnected', disconnected)
    })

    this.fetchData()

    this.$onBtStatusChange((enabled) => {
      if (!enabled){
        this.disconnect()
      }
    })
  },

  beforeDestroy(){
    this.cancelDataFetch()
  },

  computed: {
    flashWriteText(){
      return this.flashWrite === 'unknown' ?
        this.flashWrite :
        this.flashWrite ? 'Yes' : 'No'
    },
    uptimeText(){
      let ms = this.uptime[0]
      return msToTime(ms)
    }
  },

  methods: {
    feedback(msg){
      this.msg = msg
      setTimeout(() => {
        this.msg = null
      }, 2000)
    },

    onError(err){
      this.$handleError(err)
    },

    async disconnect(){
      this.cancelDataFetch()
      await this.$dongle.disconnect()
      this.$navigateTo(Welcome)
    },

    async fetchData(){
      await this.checkFlashUsage()
      await this.getMemoryUsage()
      await this.getUptime()
    },

    async renameDevice(){
      let name = this.newDeviceName
      await this.$dongle.setName(name)
      this.doingRename = false
      this.deviceName = this.newDeviceName
      this.feedback('Renamed to ' + name)
    },

    getMemoryUsage(){
      return this.$dongle.getMemoryUsage().then(usage => {
        this.memoryUsage = usage
      })
      .catch(err => this.onError(err))
    },

    checkFlashUsage(){
      return this.$dongle.sendCommand('isWritingToFlash').then((used) => {
        this.flashWrite = used[0]
      })
      .catch(err => this.onError(err))
    },

    getUptime(){
      return this.$dongle.sendCommand('getUptime').then((used) => {
        this.uptime = [used[0], used[1]]
      })
      .catch(err => this.onError(err))

    },

    toggleFlash(){
      let command = this.flashWrite === 1 ? 'stopWritingToFlash' : 'startWritingToFlash'
      return this.$dongle.sendCommand(command).then(() => {
        return this.checkFlashUsage()
      })
      .catch(err => this.onError(err))
    },

    recordPrimary(){
      this.busy = true
      return this.$dongle.sendCommand('recordPrimaryEncounterEvent').then(() => {
        this.recordedPrimary = true
        this.feedback('Set encounter flag in device')
      })
      .catch(err => this.onError(err))
      .finally(() => {
        this.busy = false
      })
    },

    recordSecondary(){
      this.busy = true
      return this.$dongle.sendCommand('recordSecondaryEncounterEvent').then(() => {
        this.recordedPrimary = false
        this.feedback('Unset encounter flag in device')
      })
      .catch(err => this.onError(err))
      .finally(() => {
        this.busy = false
      })
    },

    eraseFlash(){
      this.busy = true
      return this.$dongle.sendCommand('eraseFlash').then(() => {
        this.feedback('Erasing flash')
      })
      .catch(err => this.onError(err))
      .finally(() => {
        this.busy = false
      })
    },

    cancelDataFetch(){
      if (this._dataFetchInterrupt){
        this._dataFetchInterrupt.interrupt = true
      }
      this.progress = 0
    },

    async saveDataFile(){
      this.cancelDataFetch()
      this._dataFetchInterrupt = {
        interrupt: false,
        onProgress: (received, expected) => {
          this.progress = received / expected * 100
        }
      }

      try {
        let data = await this.$dongle.fetchData(this._dataFetchInterrupt)
        await saveTextData(this.deviceName, bytesToCsv(data), 'csv')
      } catch (e){
        if (e instanceof InterruptException){
          // no action
        } else {
          this.onError(e)
        }
      } finally {
        this.progress = 0
      }
    }
  }
}
</script>

<style scoped>
.main {
  margin: 20 0;
  padding: 0;
}
Switch {
  margin: 0;
  padding: 0;
}
Label {
  padding: 4 20;
  font-size: 20;
}
.buttons {
  margin-top: 20;
}
.msg {
  color: rgb(85, 120, 85);
}
.divider {
  margin-top: 80;
}
.pad {
  padding: 0 16;
}
.btn-alone {
  color: rgb(62, 55, 0);
  background: rgb(238, 212, 14);
}
</style>

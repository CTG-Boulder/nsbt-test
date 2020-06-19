<template>
  <Page>
    <ActionBar :title="`Connected to ${deviceName}`" />
    <StackLayout class="main">
      <Button text="Refresh" @tap="fetchData" />

      <Label :text="`Uptime: ${uptimeText}`" />

      <Label :text="`Memory used: ${memoryUsage} blocks`" />

      <StackLayout orientation="horizontal">
        <Label verticalAlignment="center" :text="`Writing to Flash?: ${flashWriteText}`" />
        <Switch :checked="flashWrite === 1" @checkedChange="toggleFlash"/>
      </StackLayout>

      <FlexboxLayout v-show="flashWrite === 1" class="buttons" orientation="horizontal">
        <Button flexGrow="1" text="Record Primary" @tap="recordPrimary" />
        <Button flexGrow="1" text="Record Secondary" @tap="recordSecondary" />
      </FlexboxLayout>
      <ActivityIndicator :busy="busy" />
      <Label v-show="msg" class="msg" :text="msg" />

      <Button class="btn-disconnect" text="Disconnect" @tap="disconnect" />

      <!-- <HtmlView :html="`<pre>${JSON.stringify(memoryUsage, null, 4)}</pre>`" /> -->
    </StackLayout>
  </Page>
</template>

<script>
import Welcome from './Welcome'

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
      connected: false,
      deviceName: '',
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

    async disconnect(){
      await this.$dongle.disconnect()
      this.$navigateTo(Welcome)
    },

    async fetchData(){
      await this.checkFlashUsage()
      await this.getMemoryUsage()
      await this.getUptime()
    },

    getMemoryUsage(){
      return this.$dongle.getMemoryUsage().then(usage => {
        this.memoryUsage = usage
      }).catch((err) => {
        this.$emit('error', err)
      })
    },

    checkFlashUsage(){
      return this.$dongle.sendCommand('isWritingToFlash').then((used) => {
        this.flashWrite = used[0]
      }).catch((err) => {
        this.$emit('error', err)
      })
    },

    getUptime(){
      return this.$dongle.sendCommand('getUptime').then((used) => {
        this.uptime = [used[0], used[1]]
      }).catch((err) => {
        this.$emit('error', err)
      })
    },

    toggleFlash(){
      let command = this.flashWrite === 1 ? 'stopWritingToFlash' : 'startWritingToFlash'
      return this.$dongle.sendCommand(command).then(() => {
        return this.checkFlashUsage()
      }).catch((err) => {
        this.$emit('error', err)
      })
    },

    recordPrimary(){
      this.busy = true
      return this.$dongle.sendCommand('recordPrimaryEncounterEvent').then(() => {
        this.feedback('Recorded primary event')
      }).catch((err) => {
        this.$emit('error', err)
      }).finally(() => {
        this.busy = false
      })
    },

    recordSecondary(){
      this.busy = true
      return this.$dongle.sendCommand('recordSecondaryEncounterEvent').then(() => {
        this.feedback('Recorded secondary event')
      }).catch((err) => {
        this.$emit('error', err)
      }).finally(() => {
        this.busy = false
      })
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
.btn-disconnect {
  margin-top: 80;
  color: #ffeeee;
  background: #aa0000;
}
</style>

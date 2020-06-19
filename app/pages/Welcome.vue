<template>
  <Page>
    <ActionBar title="Welcome" />
    <StackLayout>
      <!-- <Label :text="Welcome" /> -->
      <Button class="btn-connect" text="Connect to Encounter Device" @tap="toDeviceList" />
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
    }
  },
  methods: {
    toDeviceList(){
      this.$navigateTo(DeviceList)
    }
  }
}
</script>

<style scoped>
.btn-connect {
  color: rgb(239, 255, 238);
  background: rgb(80, 191, 93);
}
</style>

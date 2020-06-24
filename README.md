# Bluetooth nativescript test app

## Development setup

[Follow instructions here](https://nativescript-vue.org/en/docs/getting-started/quick-start/)

```bash
# Install dependencies
yarn install
```

## Usage

Plug in an android or ios device via USB.

### Android

``` bash
# Build, watch for changes and run the application
tns run android

# Build, watch for changes and debug the application
tns debug <platform>

# Build for production
tns build <platform> --env.production

```

## iOS

Getting this working on an ios device requires getting through apple's app signing
system. You will need to provide a team id when you run this...

```bash
tns run ios --team-id <TEAM_ID>
```

In order to set this up initially you may have to follow [these instructions](https://github.com/NativeScript/nativescript-cli/issues/3231#issuecomment-483624268)

**Plug in your device via usb, then...**

Steps:

1. Open XCode
2. Create a new basic project
3. Go to Preferences-> Accounts and ensure you have an account with a team and certificate. If not, create one.
4. Go to the Project settings (side panel, blue icon) then go to Signing & Capabilities
5. Select a team for your project
6. Enter the bundle identifier: `com.nativescript.EncounterTracingController`
7. Xcode will prompt you to sign the certificates
8. Attempt to run the app on your device (select box near play button)
9. This won't work yet, you need to go to your device, and on your device go to Settings -> General -> Device Management and trust the developer app

Now you can try running the nativescript command in terminal and again, on your device you will need to trust it again... and again... and again every time you restart nativescript.

### Debugging

You can also use vue-devtools by opening a separate terminal and running:

```bash
npx vue-devtools
```

**NOTE**: You will need to change the ip address in `main.js` to match your host
machine.

## Resources

* https://market.nativescript.org/plugins/nativescript-bluetooth

# Bluetooth nativescript test app

## Development setup

[Follow instructions here](https://nativescript-vue.org/en/docs/getting-started/quick-start/)

```bash
# Install dependencies
yarn install
```

## Usage

Plug in an android or ios device via USB.

``` bash
# Build, watch for changes and run the application
tns run android
tns run ios

# Build, watch for changes and debug the application
tns debug <platform>

# Build for production
tns build <platform> --env.production

```

You can also use vue-devtools by opening a separate terminal and running:

```bash
npx vue-devtools
```

**NOTE**: You will need to change the ip address in `main.js` to match your host
machine.

## Resources

* https://market.nativescript.org/plugins/nativescript-bluetooth
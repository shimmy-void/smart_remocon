# Smart Remocon (Smart Remote Controller)

## Features

- can send control signal to TV (Toshiba 32R1) and air conditioner (Fujitsu AS-AH402M) using ESP32 DevKitC and IR LED.
- can operate as a web server so that you can send commands from your smart phone 

## Circuit

![Circuit](/doc/ESP32DevKitC_smart_remocon.png)

## Usage

> The project is built for VSCode with platformIO extension.
>
> The OTA functionality is used to upload firmware and web front-end files in this example.

1. Clone this repository on a directory.

    ```shell
    git clone https://github.com/shimmy-void/smart_remocon.git
    ```

2. Create a file to make configuration for wifi connection in `src/wifi_setting.hpp` and edit it as the following:

    ```cpp
    const char* ssid = "<YOUR_WIFI_SSID>";
    const char* password = "<YOUR_WIFI_PASSWORD>";
    ```

3. Assign a IP address for the ESP32 in your router.

    > In this example, a local IP address ``192.168.1.101`` is set for the ESP32.

4. Edit platformio.ini to set the assigned IP address for the ESP32.
    ```
    upload_port = <YOUR_ESP32_IP_ADDRESS>
    ```

5. Upload files of web contents (files in ``data`` folder) using OTA.

    Click the platformIO icon on the Activity Bar, and then click the following button:
    ``PROJECT TASKS > Platform > Upload Filesystem Image OTA``

6. Build the source code and upload the binary to the ESP32.

7. Open a browser and go to ``192.168.1.101/``, then you will see the interface like the following image if the ESP32 could successfully connet to the Wifi and you could connect it.

![interface1](/doc/ss_tv.png)
![interface2](/doc/ss_ac.png)

### Interface
- TV

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/power-off.svg" width="16" height="16"> : Toggle power on/off

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/volume-high.svg" width="16" height="16"> : Turn volume high

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/volume-low.svg" width="16" height="16"> : Turn volume low

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/volume-xmark.svg" width="16" height="16"> : Mute

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/display.svg" width="16" height="16"> : Change input

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/table-list.svg" width="16" height="16"> : Show programs

- Air Conditioner

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/power-off.svg" width="16" height="16"> : Toggle power on/off

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/a.svg" width="16" height="16"> : Change mode to Auto

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/fire-flame-curved.svg" width="16" height="16"> : Change mode to Heat

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/snowflake.svg" width="16" height="16"> : Change mode to Cool

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/droplet.svg" width="16" height="16"> : Change mode to Dry

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/fan.svg" width="16" height="16"> : Change mode to Fan

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/money-bill-wave.svg" width="16" height="16"> : Toggle Economy mode on

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/droplet-slash.svg" width="16" height="16"> : Toggle Clean mode on

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/bolt.svg" width="16" height="16"> : Toggle Powerful mode on

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/volume-low.svg" width="16" height="16"> : Toggle Outside Quiet mode (this command is valid only when AC is turned off)

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/headphones.svg" width="16" height="16"> : Toggle Eco Fan mode (this command is valid only when AC is turned off)

  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/virus-slash.svg" width="16" height="16"> : Turn Sterilization on (this command is valid only when AC is turned off)

8. Enjoy it!

## Dependency

- IRremoteESP8266

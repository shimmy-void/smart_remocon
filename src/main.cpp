#include <Arduino.h>
#include <IRsend.h>
#include <IRac.h>
#include "ir_Fujitsu.h"
#include "SPIFFS.h"
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include "wifi_setting.hpp"

constexpr const uint16_t PIN_IRLED {2};
constexpr const uint32_t BAUD_RATE {115200};

constexpr const uint64_t TV_POWER   {0x2FD48B7UL};
constexpr const uint64_t TV_VOL_P   {0x2FD58A7UL};
constexpr const uint64_t TV_VOL_M   {0x2FD7887UL};
constexpr const uint64_t TV_MUTE    {0x2FD08F7UL};
constexpr const uint64_t TV_CH_P    {0x2FDD827UL};
constexpr const uint64_t TV_CH_M    {0x2FDF807UL};
constexpr const uint64_t TV_CHNG_IN {0x2FDF00FUL};
constexpr const uint64_t TV_PROG    {0x2FD7689UL};

constexpr const uint8_t CMD_POWERFUL      {kFujitsuAc264SpCmdTogglePowerful};
constexpr const uint8_t CMD_TURNOFF       {kFujitsuAc264SpCmdTurnOff};
constexpr const uint8_t CMD_ECOFAN_OFF    {kFujitsuAc264SpCmdEcoFanOff};
constexpr const uint8_t CMD_ECOFAN_ON     {kFujitsuAc264SpCmdEcoFanOn};
constexpr const uint8_t CMD_OUT_QUIET_OFF {kFujitsuAc264SpCmdOutsideQuietOff};
constexpr const uint8_t CMD_OUT_QUIET_ON  {kFujitsuAc264SpCmdOutsideQuietOn};
constexpr const uint8_t CMD_STERILIZATION {kFujitsuAc264SpCmdToggleSterilization};

constexpr const uint8_t MODE_AUTO         {kFujitsuAc264ModeAuto};
constexpr const uint8_t MODE_COOL         {kFujitsuAc264ModeCool};
constexpr const uint8_t MODE_DRY          {kFujitsuAc264ModeDry};
constexpr const uint8_t MODE_HEAT         {kFujitsuAc264ModeHeat};
constexpr const uint8_t MODE_FAN          {kFujitsuAc264ModeFan};

constexpr const uint8_t FAN_AUTO          {kFujitsuAc264FanSpeedAuto};
constexpr const uint8_t FAN_QUIET         {kFujitsuAc264FanSpeedQuiet};
constexpr const uint8_t FAN_LOW           {kFujitsuAc264FanSpeedLow};
constexpr const uint8_t FAN_MED           {kFujitsuAc264FanSpeedMed};
constexpr const uint8_t FAN_HI            {kFujitsuAc264FanSpeedHigh};

constexpr const uint8_t TIM_EN_ON         {kFujitsuAc264OnTimerEnable};
constexpr const uint8_t TIM_EN_OFF        {kFujitsuAc264OffTimerEnable};
constexpr const uint8_t TIM_EN_BOTH       {kFujitsuAc264OnOffTimerEnable};

const char* ntpServer {"jp.pool.ntp.org"};
int timeZone {32400};

// hw_timer_t* timer {};
unsigned long currentMillis {};

WebServer server(80);
String header;

IRsend tv(PIN_IRLED);
IRFujitsuAC264 ac(PIN_IRLED);
decode_results results;

struct state {
  uint8_t mode {MODE_COOL}, fanSpeed {FAN_AUTO}, fanAngle {1}, onTimer {0}, offTimer {0};
  uint8_t cmd {0};
  uint16_t clock {0}, slpTimer {0};
  float temperature {24}, tempAuto {0};
  bool statusPower {false}, statusOutsideQuiet {false}, statusEcoFan {false};
  bool statusSlpTimer {false}, statusOnTimer {false}, statusOffTimer {false};
  bool togglePowerful {false}, toggleSterilization {false};
  bool swing {false}, clean {false}, economy {false};
};
state acState;

void printState() {
  // Display the settings.
  Serial.println("Fujitsu A/C 264 remote is in the following state:");
  Serial.printf("  %s\n", ac.toString().c_str());
  // Display the encoded IR sequence.
  unsigned char* ir_code = ac.getRaw();
  Serial.print("IR Code: 0x");
  for (uint8_t i = 0; i < ac.getStateLength(); i++)
    Serial.printf("%02X", ir_code[i]);
  Serial.println();
}

void setClock() {
  struct tm timeInfo;
  if (getLocalTime(&timeInfo)) {
    acState.clock = timeInfo.tm_hour * 60 + timeInfo.tm_min;
    ac.setClock(acState.clock);
  }
}

void getAc() {
  uint8_t cmd = ac.getCmd();
  if ((cmd & 0xF0) == 0xF0)
    acState.cmd = cmd;
  else
    acState.cmd = 0;
  acState.mode = ac.getMode();
  acState.temperature = ac.getTemp();
  acState.tempAuto = ac.getTempAuto();
  acState.fanSpeed = ac.getFanSpeed();
  acState.fanAngle = ac.getFanAngle();
  acState.swing = ac.getSwing();
  acState.economy = ac.getEconomy();
  acState.clean = ac.getClean();
  acState.clock = ac.getClock();
  uint16_t slpTimer = ac.getSleepTimer();
  if (slpTimer != 0) {
    acState.statusSlpTimer = true;
    acState.slpTimer = slpTimer;
  }
  acState.statusOnTimer = (ac.getTimerEnable() & TIM_EN_ON);
  acState.statusOffTimer = (ac.getTimerEnable() & TIM_EN_OFF);
  acState.onTimer = ac.getOnTimer();
  acState.offTimer = ac.getOffTimer();
}

void setAc() {
  if ((acState.cmd & 0xF0) == 0xF0) {   // treat special commands
    switch (acState.cmd) {
      case CMD_TURNOFF:
        ac.off();
        break;
      case CMD_POWERFUL:
        ac.togglePowerful();
        break;
      case CMD_STERILIZATION:
        ac.toggleSterilization();
        break;
      case CMD_ECOFAN_OFF:
        ac.setEcoFan(false);
        break;
      case CMD_ECOFAN_ON:
        ac.setEcoFan(true);
        break;
      case CMD_OUT_QUIET_OFF:
        ac.setOutsideQuiet(false);
        break;
      case CMD_OUT_QUIET_ON:
        ac.setOutsideQuiet(true);
        break;
      default:
        break;
    }
  } else {
    ac.on();
    ac.setTemp(acState.temperature);
    ac.setTempAuto(acState.tempAuto);
    ac.setMode(acState.mode);
    if (acState.mode == MODE_AUTO) {
      acState.fanSpeed = FAN_AUTO;
      ac.setFanSpeed(acState.fanSpeed);
    } else {
      ac.setFanSpeed(acState.fanSpeed);
    }
    ac.setSwing(acState.swing);
    if (acState.cmd == 0x22)
      ac.setFanAngle(acState.fanAngle);
    ac.setEconomy(acState.economy);
    ac.setClean(acState.clean);
    ac.setClock(acState.clock);
    uint16_t slptimer_value = (acState.statusSlpTimer)? acState.slpTimer: 0;
    ac.setSleepTimer(slptimer_value);
    ac.setTimerEnable(acState.statusOffTimer << 1 | acState.statusOnTimer);
    if (acState.statusOnTimer)
      ac.setOnTimer(acState.onTimer);
    if (acState.statusOffTimer)
      ac.setOffTimer(acState.offTimer);
    ac.setCmd(acState.cmd);
  }
}

void handleNotFound() {
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
}

void setup() {
  tv.begin();
  ac.begin();
  Serial.begin(BAUD_RATE);
  delay(200);

  if (!SPIFFS.begin(true)) {
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  Serial.println("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  server.begin();

  configTime(timeZone, 0, ntpServer);   // set sntp to get time info from an ntp server

  ArduinoOTA
    .onStart([]() {
      String type;
      if (ArduinoOTA.getCommand() == U_FLASH)
        type = "sketch";
      else // U_SPIFFS
        type = "filesystem";

      // NOTE: if updating SPIFFS this would be the place to unmount SPIFFS using SPIFFS.end()
      Serial.println("Start updating " + type);
    })
    .onEnd([]() {
      Serial.println("\nEnd");
    })
    .onProgress([](unsigned int progress, unsigned int total) {
      Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
    })
    .onError([](ota_error_t error) {
      Serial.printf("Error[%u]: ", error);
      if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
      else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
      else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
      else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
      else if (error == OTA_END_ERROR) Serial.println("End Failed");
    });

  ArduinoOTA.begin();

  Serial.println("Default state of the remote.");
  printState();

  server.on("/", []() {
    server.sendHeader("Location", String("index.html"), true);
    server.send(302, "text/plain", "");
  });

  server.on("/tv_power", HTTP_GET, []() {
    tv.sendNEC(TV_POWER);
    delay(2000);
    server.send(200, "text/plain", "");
  });

  server.on("/tv_volp", HTTP_GET, []() {
    tv.sendNEC(TV_VOL_P);
    delay(2000);
    server.send(200, "text/plain", "");
  });

  server.on("/tv_volm", HTTP_GET, []() {
    tv.sendNEC(TV_VOL_M);
    delay(2000);
    server.send(200, "text/plain", "");
  });

  server.on("/tv_mute", HTTP_GET, []() {
    tv.sendNEC(TV_MUTE);
    delay(2000);
    server.send(200, "text/plain", "");
  });

  server.on("/tv_chp", HTTP_GET, []() {
    tv.sendNEC(TV_CH_P);
    delay(2000);
    server.send(200, "text/plain", "");
  });

  server.on("/tv_chm", HTTP_GET, []() {
    tv.sendNEC(TV_CH_M);
    delay(2000);
    server.send(200, "text/plain", "");
  });

  server.on("/tv_chngin", HTTP_GET, []() {
    tv.sendNEC(TV_CHNG_IN);
    delay(2000);
    server.send(200, "text/plain", "");
  });

  server.on("/tv_prog", HTTP_GET, []() {
    tv.sendNEC(TV_PROG);
    delay(2000);
    server.send(200, "text/plain", "");
  });

  setAc();

  server.on("/ac_state", HTTP_GET, []() {
    DynamicJsonDocument root(1024);
    root["cmd"] = acState.cmd;
    root["mode"] = acState.mode;
    root["fanspeed"] = acState.fanSpeed;
    root["temp"] = acState.temperature;
    root["tempauto"] = acState.tempAuto;
    root["power"] = acState.statusPower;

    root["fanangle"] = acState.fanAngle;
    root["swing"] = acState.swing;
    root["economy"] = acState.economy;
    root["clean"] = acState.clean;

    root["clock"] = acState.clock;
    root["slptimer_en"] = acState.statusSlpTimer;
    root["slptimer_val"] = acState.slpTimer;
    root["ontimer_en"] = acState.statusOnTimer;
    root["ontimer_val"] = acState.onTimer;
    root["offtimer_en"] = acState.statusOffTimer;
    root["offtimer_val"] = acState.offTimer;

    root["outsidequiet"] = acState.statusOutsideQuiet;
    root["ecofan"] = acState.statusEcoFan;
    String output;
    serializeJson(root, output);
    server.send(200, "text/plain", output);
  });

  server.on("/ac_state", HTTP_PUT, []() {
    DynamicJsonDocument root(1024);
    DeserializationError error = deserializeJson(root, server.arg("plain"));
    if (error) {
      server.send(404, "text/plain", "FAIL. " + server.arg("plain"));
    } else {
      if (root.containsKey("temp"))
        acState.temperature = (float) root["temp"];
      if (root.containsKey("tempauto"))
        acState.tempAuto = (float) root["tempauto"];
      if (root.containsKey("fanspeed"))
        acState.fanSpeed = (uint8_t) root["fanspeed"];
      if (root.containsKey("power"))
        acState.statusPower = root["power"];
      if (root.containsKey("mode"))
        acState.mode = root["mode"];
      if (root.containsKey("fanangle"))
        acState.fanAngle = root["fanangle"];
      if (root.containsKey("swing"))
        acState.swing = root["swing"];
      if (root.containsKey("economy"))
        acState.economy = root["economy"];
      if (root.containsKey("clean"))
        acState.clean = root["clean"];
      if (root.containsKey("clock"))
        acState.clock = root["clock"];
      if (root.containsKey("slptimer"))
        acState.slpTimer = root["slptimer"];
      if (root.containsKey("ontimer"))
        acState.onTimer = root["ontimer"];
      if (root.containsKey("offtimer"))
        acState.offTimer = root["offtimer"];
      if (root.containsKey("cmd"))
        acState.cmd = root["cmd"];
      if (root.containsKey("slptimer_en"))
        acState.statusSlpTimer = root["slptimer_en"];
      if (root.containsKey("slptimer_val"))
        acState.slpTimer = root["slptimer_val"];
      if (root.containsKey("ontimer_en"))
        acState.statusOnTimer = root["ontimer_en"];
      if (root.containsKey("ontimer_val"))
        acState.onTimer = root["ontimer_val"];
      if (root.containsKey("offtimer_en"))
        acState.statusOffTimer = root["offtimer_en"];
      if (root.containsKey("offtimer_val"))
        acState.offTimer = root["offtimer_val"];
      if (root.containsKey("powerful"))
        acState.togglePowerful = root["powerful"];
      if (root.containsKey("outsidequiet"))
        acState.statusOutsideQuiet = root["outsidequiet"];
      if (root.containsKey("ecofan"))
        acState.statusEcoFan = root["ecofan"];
      if (root.containsKey("sterilization"))
        acState.toggleSterilization = root["sterilization"];
      String output;
      serializeJson(root, output);
      server.send(200, "text/plain", output);
      delay(200);

      setAc();
      setClock();
      ac.send();
      printState();
    }
  });

  server.on("/reset", []() {
    server.send(200, "text/html", "reset");
    delay(100);
    ESP.restart();
  });

  server.serveStatic("/", SPIFFS, "/", "max-age=86400");
  server.onNotFound(handleNotFound);
  server.begin();
}

void loop() {
  ArduinoOTA.handle();
  server.handleClient();
}

const elemTxtAcPower = document.getElementById("txt-ac-power");
const elemTxtAcTemp = document.getElementById("txt-ac-temp");
const elemTxtSlpTimer = document.getElementById("txt-ac-slptimer");
const elemTxtOnTimer = document.getElementById("txt-ac-ontimer");
const elemTxtOffTimer = document.getElementById("txt-ac-offtimer");
const elemBtnAcPower = document.getElementById("btn-ac-power");
const elemBtnAcModeAuto = document.getElementById("btn-ac-mode-auto");
const elemBtnAcModeHeat = document.getElementById("btn-ac-mode-heat");
const elemBtnAcModeCool = document.getElementById("btn-ac-mode-cool");
const elemBtnAcModeDry = document.getElementById("btn-ac-mode-dry");
const elemBtnAcModeFan = document.getElementById("btn-ac-mode-fan");
const elemBtnAcFanAuto = document.getElementById("btn-ac-fanspeed-auto");
const elemSelAcFanSpeed = document.getElementById("slct-fanspeed");
const elemBtnAcSwing = document.getElementById("btn-ac-swing");
const elemSelAcFanAngle = document.getElementById("slct-fanangle");
const elemBtnAcEconomy = document.getElementById("btn-ac-economy");
const elemBtnAcClean = document.getElementById("btn-ac-clean");
const elemBtnAcPowerful = document.getElementById("btn-ac-powerful");
const elemBtnAcTempP = document.getElementById("btn-ac-tempp");
const elemBtnAcTempM = document.getElementById("btn-ac-tempm");
const elemBtnAcSlpTimer = document.getElementById("btn-ac-slptimer");
const elemBtnAcSlpTimerP = document.getElementById("btn-ac-slptimerp");
const elemBtnAcSlpTimerM = document.getElementById("btn-ac-slptimerm");
const elemBtnAcOnTimer = document.getElementById("btn-ac-ontimer");
const elemBtnAcOnTimerP = document.getElementById("btn-ac-ontimerp");
const elemBtnAcOnTimerM = document.getElementById("btn-ac-ontimerm");
const elemBtnAcOffTimer = document.getElementById("btn-ac-offtimer");
const elemBtnAcOffTimerP = document.getElementById("btn-ac-offtimerp");
const elemBtnAcOffTimerM = document.getElementById("btn-ac-offtimerm");
const elemBtnAcOutsideQuiet = document.getElementById("btn-ac-outsidequiet");
const elemBtnAcEcoFan = document.getElementById("btn-ac-ecofan");
const elemBtnAcSterilization = document.getElementById("btn-ac-sterilization");

let state = {};
let timer_handler = {};

function updateBtn(elemBtn, on) {
  if (on) {
    elemBtn.classList.remove("off");
    elemBtn.classList.add("on");
  } else {
    elemBtn.classList.remove("on");
    elemBtn.classList.add("off");
  }
}

function updateSpBtns(power) {
  elemBtnAcPowerful.disabled = !power;
  elemBtnAcEcoFan.disabled = power;
  elemBtnAcOutsideQuiet.disabled = power;
  elemBtnAcSterilization.disabled = power;
}

function updatePwBtns(power) {
  state["power"] = power;
  if (power)
    setModeCmd(state["mode"]);
  else
    state["cmd"] = 0xF1;
  elemTxtAcPower.innerHTML = (power)? " ON": " OFF";
  updateBtn(elemBtnAcPower, power);
  updateSpBtns(power);
}

function setModeColor(mode) {
  if (mode === 0) {
    updateFanSpeedBtns(0);
    state["fanspeed"] = 0;
  }
  updateBtn(elemBtnAcModeAuto, (mode === 0));
  updateBtn(elemBtnAcModeCool, (mode === 1));
  updateBtn(elemBtnAcModeDry, (mode === 5));
  updateBtn(elemBtnAcModeHeat, (mode === 4));
  updateBtn(elemBtnAcModeFan, (mode === 3));
}

function setModeCmd(mode) {
  switch(mode) {
    case 0:
      state["cmd"] = 0x04;
      break;
    case 1:
      state["cmd"] = 0x01;
      break;
    case 3:
      state["cmd"] = 0x05;
      break;
    case 4:
      state["cmd"] = 0x02;
      break;
    case 5:
      state["cmd"] = 0x03;
      break;
    default:
      break;
  }
}

function updateFanSpeedBtns(fanspeed) {
  elemSelAcFanSpeed.value = fanspeed;
  updateBtn(elemBtnAcFanAuto, (fanspeed === 0));
  updateBtn(elemSelAcFanSpeed, (fanspeed !== 0));
}

function updateFanAngleBtns(swing, fanangle) {
  elemSelAcFanAngle.value = swing? 15: fanangle;
  updateBtn(elemBtnAcSwing, swing);
  updateBtn(elemSelAcFanAngle, !swing);
}

function disp_temp() {
  let sign_str = (state["tempauto"] > 0)? "+": "";
  if (state["mode"] === 0)
    elemTxtAcTemp.innerHTML = sign_str + state["tempauto"] + " C";
  else
    elemTxtAcTemp.innerHTML = state["temp"] + " C";
}

function disp_timer(element, state_key) {
  let multiplier = (state_key === "slptimer_val")? 1: 10;
  element.innerHTML = (Math.trunc((multiplier * state[state_key]) / 60)).toString().padStart(2, '0') +
                      ":" + ((multiplier * state[state_key]) % 60).toString().padStart(2, '0');
}

function updateStatus() {
  const xhttp = new XMLHttpRequest();
  xhttp.onload = function() {
    console.log(this.responseText);
    state = JSON.parse(this.responseText);
    updatePwBtns(state["power"]);
    setModeColor(state["mode"]);
    updateFanSpeedBtns(state["fanspeed"]);
    updateFanAngleBtns(state["swing"], state["fanangle"]);
    updateBtn(elemBtnAcEconomy, state["economy"]);
    updateBtn(elemBtnAcClean, state["clean"]);
    disp_temp();
    updateBtn(elemBtnAcSlpTimer, state["slptimer_en"]);
    updateBtn(elemBtnAcOnTimer, state["ontimer_en"]);
    updateBtn(elemBtnAcOffTimer, state["offtimer_en"]);
    disp_timer(elemTxtSlpTimer, "slptimer_val");
    disp_timer(elemTxtOnTimer, "ontimer_val");
    disp_timer(elemTxtOffTimer, "offtimer_val");
    updateBtn(elemBtnAcOutsideQuiet, state["outsidequiet"]);
    updateBtn(elemBtnAcEcoFan, state["ecofan"]);
  }
  xhttp.open("GET", "/ac_state", true);
  xhttp.send();
}

updateStatus();

function postData(ac_state) {
  const xhttp = new XMLHttpRequest();
  xhttp.timeout = 2000;
  xhttp.open("PUT", "/ac_state", !0);
  xhttp.setRequestHeader("Content-Type", "application/json");
  console.log(JSON.stringify(ac_state)), xhttp.send(JSON.stringify(ac_state));
}

function mode_onclick(event) {
  let mode = event.currentTarget.myParam;
  state["mode"] = mode;
  setModeCmd(mode);
  setModeColor(mode);
  disp_temp();
  updatePwBtns(true);
  postData(state);
}

function fanauto_onclick(event) {
  let fanspeed = event.currentTarget.myParam;
  if (state["mode"] !== 0) {    // If mode != Auto
    state["fanspeed"] = fanspeed;
    state["cmd"] = 0x1E;
    updateFanSpeedBtns(fanspeed);
    postData(state);
  }
}

function fanspeed_onchange(event) {
  let fanspeed = elemSelAcFanSpeed.value
  state["fanspeed"] = fanspeed;
  state["cmd"] = 0x1E;
  updateFanSpeedBtns(fanspeed);
  postData(state);
}

function power_onclick() {
  updatePwBtns(!state["power"]);
  postData(state);
}

function temp_onclick(event) {
  let temp_add = event.currentTarget.myParam;
  let temp_min = (state["mode"] === 3)? 16.0: 18.0;
  if (state["mode"] === 0) {
    state["tempauto"] += temp_add;
    if (state["tempauto"] < -2.0)
      state["tempauto"] = -2.0;
    if (state["tempauto"] > 2.0)
      state["tempauto"] = 2.0;
  } else {
    state["temp"] += temp_add;
    if (state["temp"] < temp_min)
      state["temp"] = temp_min;
    if (state["temp"] > 30.0)
      state["temp"] = 30.0;
  }
  state["cmd"] = 0x07;
  disp_temp();
  postData(state);
}

function fanangle_onchange(event) {
  state["fanangle"] = elemSelAcFanAngle.value;
  state["swing"] = false;
  state["cmd"] = 0x22;
  updateFanAngleBtns(state["swing"], state["fanangle"]);
  postData(state);
}

function swing_onclick(event) {
  state["swing"] = !state["swing"];
  state["fanangle"] = 0xF;
  state["cmd"] = 0x0B;
  updateFanAngleBtns(state["swing"], state["fanangle"]);
  postData(state);
}

function economy_onclick(event) {
  state["economy"] = !state["economy"];
  state["cmd"] = 0x14;
  updateBtn(elemBtnAcEconomy, state["economy"]);
  postData(state);
}

function clean_onclick(event) {
  state["clean"] = !state["clean"];
  state["cmd"] = 0x1B;
  updateBtn(elemBtnAcClean, state["clean"]);
  postData(state);
}

function powerful_onclick(event) {
  state["cmd"] = 0xF0;
  postData(state);
}

function outsidequiet_onclick(event) {
  state["outsidequiet"] = !state["outsidequiet"];
  state["cmd"] = (state["outsidequiet"])? 0xF5: 0xF4;
  updateBtn(elemBtnAcOutsideQuiet, state["outsidequiet"]);
  postData(state);
}

function ecofan_onclick(event) {
  state["ecofan"] = !state["ecofan"];
  state["cmd"] = (state["ecofan"])? 0xF3: 0xF2;
  updateBtn(elemBtnAcEcoFan, state["ecofan"]);
  postData(state);
}

function sterilization_onclick(event) {
  state["cmd"] = 0xF6;
  postData(state);
}

function on_1minute() {
  if (state["slptimer_val"] === 0) {
    clearInterval(timer_handler);
    state["slptimer_en"] = false;
    updateBtn(elemBtnAcSlpTimer, state["slptimer_en"]);
  } else {
    state["slptimer_val"]--;
  }
  disp_timer(elemTxtSlpTimer, "slptimer_val");
}

function slptimer_en_onclick(event) {
  state["slptimer_en"] = !state["slptimer_en"];
  updateBtn(elemBtnAcSlpTimer, state["slptimer_en"]);
  updatePwBtns(true);
  if (state["slptimer_en"]) {
    timer_handler = setInterval(on_1minute, 60 * 1000);
    state["cmd"] = 0x0E;
  } else {
    if (timer_handler)
      clearInterval(timer_handler);
      state["cmd"] = 0x30;
  }
  postData(state);
}

function slptimer_val_onclick(event) {
  let remainder = state["slptimer_val"] % 60;
  let time_add = event.currentTarget.myParam;
  let sum = remainder? time_add > 0? state["slptimer_val"] - remainder + 60:
                                     state["slptimer_val"] - remainder:
                       state["slptimer_val"] + time_add;
  if (sum > 12 * 60)
    sum = 0;
  if (sum < 0)
    sum = 12 * 60;
  state["slptimer_val"] = sum;
  disp_timer(elemTxtSlpTimer, "slptimer_val");
}

function ontimer_en_onclick(event) {
  state["ontimer_en"] = !state["ontimer_en"];
  state["cmd"] = (state["ontimer_en"])? 0x39: 0x3B;
  updateBtn(elemBtnAcOnTimer, state["ontimer_en"]);
  postData(state);
}

function ontimer_val_onclick(event) {
  let time_add = event.currentTarget.myParam;
  let sum = state["ontimer_val"] + time_add;
  if (sum > 23 * 6 + 5)
    sum = 0;
  if (sum < 0)
    sum = 23 * 6 + 5;
  state["ontimer_val"] = sum;
  disp_timer(elemTxtOnTimer, "ontimer_val");
}

function offtimer_en_onclick(event) {
  state["offtimer_en"] = !state["offtimer_en"];
  state["cmd"] = (state["offtimer_en"])? 0x3A: 0x3B;
  updateBtn(elemBtnAcOffTimer, state["offtimer_en"]);
  postData(state);
}

function offtimer_val_onclick(event) {
  let time_add = event.currentTarget.myParam;
  let sum = state["offtimer_val"] + time_add;
  if (sum > 23 * 6 + 5)
    sum = 0;
  if (sum < 0)
    sum = 23 * 6 + 5;
  state["offtimer_val"] = sum;
  disp_timer(elemTxtOffTimer, "offtimer_val");
}

document.getElementById("btn-tv-power").addEventListener("click", () => {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/tv_power", true);
  xhttp.send();
});

document.getElementById("btn-tv-volp").addEventListener("click", () => {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/tv_volp", true);
  xhttp.send();
});

document.getElementById("btn-tv-volm").addEventListener("click", () => {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/tv_volm", true);
  xhttp.send();
});

document.getElementById("btn-tv-mute").addEventListener("click", () => {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/tv_mute", true);
  xhttp.send();
});

document.getElementById("btn-tv-chp").addEventListener("click", () => {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/tv_chp", true);
  xhttp.send();
});

document.getElementById("btn-tv-chm").addEventListener("click", () => {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/tv_chm", true);
  xhttp.send();
});

document.getElementById("btn-tv-chngin").addEventListener("click", () => {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/tv_chngin", true);
  xhttp.send();
});

document.getElementById("btn-tv-prog").addEventListener("click", () => {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/tv_prog", true);
  xhttp.send();
});

elemBtnAcPower.addEventListener("click", power_onclick);
elemBtnAcTempP.myParam = 0.5;
elemBtnAcTempP.addEventListener("click", temp_onclick);
elemBtnAcTempM.myParam = -0.5;
elemBtnAcTempM.addEventListener("click", temp_onclick);
elemBtnAcModeAuto.myParam = 0;
elemBtnAcModeAuto.addEventListener("click", mode_onclick);
elemBtnAcModeCool.myParam = 1;
elemBtnAcModeCool.addEventListener("click", mode_onclick);
elemBtnAcModeDry.myParam = 5;
elemBtnAcModeDry.addEventListener("click", mode_onclick);
elemBtnAcModeHeat.myParam = 4;
elemBtnAcModeHeat.addEventListener("click", mode_onclick);
elemBtnAcModeFan.myParam = 3;
elemBtnAcModeFan.addEventListener("click", mode_onclick);
elemBtnAcFanAuto.myParam = 0;
elemBtnAcFanAuto.addEventListener("click", fanauto_onclick);
elemSelAcFanSpeed.addEventListener("change", fanspeed_onchange);
elemSelAcFanAngle.addEventListener("change", fanangle_onchange);
elemBtnAcSwing.addEventListener("click", swing_onclick);
elemBtnAcEconomy.addEventListener("click", economy_onclick);
elemBtnAcClean.addEventListener("click", clean_onclick);
elemBtnAcPowerful.addEventListener("click", powerful_onclick);
elemBtnAcOutsideQuiet.addEventListener("click", outsidequiet_onclick);
elemBtnAcEcoFan.addEventListener("click", ecofan_onclick);
elemBtnAcSterilization.addEventListener("click", sterilization_onclick);
elemBtnAcSlpTimer.addEventListener("click", slptimer_en_onclick);
elemBtnAcOnTimer.addEventListener("click", ontimer_en_onclick);
elemBtnAcOffTimer.addEventListener("click", offtimer_en_onclick);
elemBtnAcSlpTimerP.myParam = 60;
elemBtnAcSlpTimerP.addEventListener("click", slptimer_val_onclick);
elemBtnAcSlpTimerM.myParam = -60;
elemBtnAcSlpTimerM.addEventListener("click", slptimer_val_onclick);
elemBtnAcOnTimerP.myParam = 1;
elemBtnAcOnTimerP.addEventListener("click", ontimer_val_onclick);
elemBtnAcOnTimerM.myParam = -1;
elemBtnAcOnTimerM.addEventListener("click", ontimer_val_onclick);
elemBtnAcOffTimerP.myParam = 1;
elemBtnAcOffTimerP.addEventListener("click", offtimer_val_onclick);
elemBtnAcOffTimerM.myParam = -1;
elemBtnAcOffTimerM.addEventListener("click", offtimer_val_onclick);

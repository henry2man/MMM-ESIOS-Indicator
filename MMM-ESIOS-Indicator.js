/* global Module */

/* Magic Mirror
 * Module: MMM-ESIOS-Indicator
 *
 * By Enrique Cardona
 * MIT Licensed.
 */

Module.register("MMM-ESIOS-Indicator", {
  // Colors
  colors: {
    limeToGreen: [
      [212, 226, 132],
      [0, 173, 14],
    ],
    yellowToRed: [
      [255, 238, 82],
      [173, 0, 14],
    ],
    blueToRed: [
      [38, 0, 255],
      [255, 0, 0],
    ],
    blueToPurple: [
      [38, 0, 255],
      [174, 0, 255],
    ],
  },

  defaults: {
    updateInterval: 300000,
    retryInterval: 5000,
    apiEndpoint: "https://api.esios.ree.es/indicators",
    indicatorId: "1001",
    geoId: "8741", // Peninsula
    token: "",
    debug: false,
    // FIXME animation
    //,
    // animated: false
  },

  requiresVersion: "2.1.0", // Required version of MagicMirror

  start: function () {
    var self = this;
    var dataRequest = null;
    var dataNotification = null;

    //Flag for check if module is loaded
    this.loaded = false;

    // Schedule update timer.

    self.getData();
    setInterval(function () {
      self.updateDom();
    }, this.config.updateInterval);
  },

  /*
   * getData
   *
   */
  getData: function () {
    var self = this;

    var urlApi = self.config.apiEndpoint + "/" + self.config.indicatorId;
    var retry = true;

    var dataRequest = new XMLHttpRequest();

    dataRequest.open("GET", urlApi, true);

    dataRequest.setRequestHeader(
      "Accept",
      "application/json; application/vnd.esios-api-v2+json"
    );
    dataRequest.setRequestHeader("Content-Type", "application/json");
    dataRequest.setRequestHeader(
      "Authorization",
      'Token token="' + self.config.token + '"'
    );

    dataRequest.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          self.processData(JSON.parse(this.response));
        } else {
          Log.error(self.name, "Could not load data:" + this.status);
        }
        if (retry) {
          self.scheduleUpdate(self.loaded ? -1 : self.config.retryDelay);
        }
      }
    };
    dataRequest.send();
  },

  /* scheduleUpdate()
   * Schedule next update.
   *
   * argument delay number - Milliseconds before next update.
   *  If empty, this.config.updateInterval is used.
   */
  scheduleUpdate: function (delay) {
    var nextLoad = this.config.updateInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }
    nextLoad = nextLoad;
    var self = this;
    setTimeout(function () {
      self.getData();
    }, nextLoad);
  },

  getDom: function () {
    var self = this;

    // create element wrapper for show into the module
    var wrapper = document.createElement("div");

    // If this.dataRequest is not empty
    if (this.dataRequest) {
      let header = document.createElement("header");
      header.className = "module-header";

      // Use translate function
      //             this id defined in translations files
      header.innerHTML =
        this.translate("TITLE") + ": " + this.dataRequest.short_name;

      wrapper.appendChild(header);

      // alt meters

      var wrapperMeters = document.createElement("div");

      self.showMeter(
        wrapperMeters,
        "METER",
        "€/MWh",
        this.dataRequest.values,
        new Date().getHours(), 
        50,
        800,
        yellowToRed,
        limeToGreen,
        "large",
        false
      );

      // if (true || this.dataRequest.Production_AC_Power_Net_WH > 0) {
      //   self.showMeter(
      //     wrapperMeters,
      //     "PRODUCTION",
      //     "Wh",
      //     this.dataRequest.Production_AC_Power_Net_WH,
      //     self.config.powerRange[0],
      //     self.config.powerRange[1],
      //     limeToGreen,
      //     yellowToRed,
      //     "normal",
      //     true
      //   );
      //   self.showMeter(
      //     wrapperMeters,
      //     "CONSUMPTION",
      //     "Wh",
      //     this.dataRequest.Consumption_AC_Power_Net_WH,
      //     self.config.powerRange[0],
      //     self.config.powerRange[1],
      //     limeToGreen,
      //     yellowToRed,
      //     "normal",
      //     true
      //   );
      // }

      wrapper.appendChild(wrapperMeters);

      // end alt meters
    }

    return wrapper;
  },

  showBar: function (
    wrapper,
    element,
    unit,
    data,
    minValue,
    maxValue,
    positiveColors,
    negativeColors
  ) {
    let center = (1 - Math.abs(minValue / (minValue - maxValue))) * 100;

    let factor =
      100 *
      (data < 0 ? Math.min(data / minValue, 1) : Math.min(data / maxValue, 1));

    let percent =
      data < 0 ? factor * (1 - center / 100) : (factor * center) / 100;

    if (self.config.debug) {
      console.log(
        "Element " +
          element +
          " - Center: " +
          center +
          "- Factor: " +
          factor +
          " %: " +
          percent
      );
    }

    let warning = data > maxValue || data < minValue;

    let colorRed =
      data < 0
        ? // little
          negativeColors[0][0] +
          // relative
          Math.round(
            ((negativeColors[1][0] - negativeColors[0][0]) * factor) / 100
          )
        : // little
          positiveColors[0][0] +
          // relative
          Math.round(
            ((positiveColors[1][0] - positiveColors[0][0]) * factor) / 100
          );

    let colorGreen =
      data < 0
        ? // little
          negativeColors[0][1] +
          // relative
          Math.round(
            ((negativeColors[1][1] - negativeColors[0][1]) * factor) / 100
          )
        : // little
          positiveColors[0][1] +
          // relative
          Math.round(
            ((positiveColors[1][1] - positiveColors[0][1]) * factor) / 100
          );

    let colorBlue =
      data < 0
        ? // little
          negativeColors[0][2] +
          // relative
          Math.round(
            ((negativeColors[1][2] - negativeColors[0][2]) * factor) / 100
          )
        : // little
          positiveColors[0][2] +
          // relative
          Math.round(
            ((positiveColors[1][2] - positiveColors[0][2]) * factor) / 100
          );

    let labelWrapper = document.createElement("p");
    labelWrapper.className = "label" + (warning ? " warning" : "");
    labelWrapper.style.color =
      "rgb(" + colorRed + ", " + colorGreen + ", " + colorBlue + ")";
    labelWrapper.innerHTML = this.translate(element) + ": " + data + " " + unit;
    wrapper.appendChild(labelWrapper);

    let newWrapper = document.createElement("div");
    newWrapper.id = "bar-div-" + element;
    newWrapper.className = "progress-bar stripes";
    let spanWrapper = document.createElement("span");
    spanWrapper.style.width = percent + "%";
    if (data < 0) {
      spanWrapper.style.marginRight = center + "%";
    } else {
      spanWrapper.style.marginLeft = 100 - center + "%";
    }

    spanWrapper.className = data < 0 ? "inverse" : "";
    // FIXME animation
    //= [
    //	self.config.animated ? "animated" : "",
    //	(data < 0 ? "inverse" : "")];

    spanWrapper.style.backgroundColor =
      "rgb(" + colorRed + ", " + colorGreen + ", " + colorBlue + ")";

    newWrapper.appendChild(spanWrapper);

    wrapper.appendChild(newWrapper);
  },

  showMeter: function (
    wrapper,
    element,
    unit,
    map,
    index,
    minValue,
    maxValue,
    positiveColors,
    negativeColors,
    clazz,
    showTitle
  ) {

    let data = map.get(index);

    var divMeters = document.createElement("div");
    divMeters.className = clazz + " bright";

    let factor =
      100 *
      (data < 0 ? Math.min(data / minValue, 1) : Math.min(data / maxValue, 1));

    let warning = data > maxValue || data < minValue;

    let colorRed =
      data < 0
        ? // little
          negativeColors[0][0] +
          // relative
          Math.round(
            ((negativeColors[1][0] - negativeColors[0][0]) * factor) / 100
          )
        : // little
          positiveColors[0][0] +
          // relative
          Math.round(
            ((positiveColors[1][0] - positiveColors[0][0]) * factor) / 100
          );

    let colorGreen =
      data < 0
        ? // little
          negativeColors[0][1] +
          // relative
          Math.round(
            ((negativeColors[1][1] - negativeColors[0][1]) * factor) / 100
          )
        : // little
          positiveColors[0][1] +
          // relative
          Math.round(
            ((positiveColors[1][1] - positiveColors[0][1]) * factor) / 100
          );

    let colorBlue =
      data < 0
        ? // little
          negativeColors[0][2] +
          // relative
          Math.round(
            ((negativeColors[1][2] - negativeColors[0][2]) * factor) / 100
          )
        : // little
          positiveColors[0][2] +
          // relative
          Math.round(
            ((positiveColors[1][2] - positiveColors[0][2]) * factor) / 100
          );

    let labelWrapper = document.createElement("span");
    labelWrapper.className = "label" + (warning ? " warning" : "");
    labelWrapper.style.color =
      "rgb(" + colorRed + ", " + colorGreen + ", " + colorBlue + ")";
    labelWrapper.innerHTML =
      (showTitle ? this.translate(element) + ": " : "") + data + " <span class='unit'>" + unit + "</span>";

    divMeters.appendChild(labelWrapper);

    wrapper.appendChild(divMeters);
  },

  getScripts: function () {
    return [];
  },

  getStyles: function () {
    return ["MMM-ESIOS-Indicator.css"];
  },

  // Load translations files
  getTranslations: function () {
    //FIXME: This can be load a one file javascript definition
    return {
      en: "translations/en.json",
      es: "translations/es.json",
    };
  },

  processData: function (data) {
    var self = this;
    // Process data, filtering

    this.dataRequest = {
      indicator: data.indicator.short_name,
      values: new Map(
        data.indicator.values
          .filter((v) => v.geo_id == self.config.geoId)
          .map((v) => [new Date(v.datetime).getHours(), v.value])
      ),
    };

    if (this.loaded === false) {
      self.updateDom(self.config.animationSpeed);
    }
    this.loaded = true;

    // the data if load
    // send notification to helper
    this.sendSocketNotification("MMM-ESIOS-Indicator-NOTIFICATION_TEST", data);
  },

  // socketNotificationReceived from helper
  socketNotificationReceived: function (notification, payload) {
    if (notification === "MMM-ESIOS-Indicator-NOTIFICATION_TEST") {
      // set dataNotification
      this.dataNotification = payload;
      this.updateDom();
    }
  },
});

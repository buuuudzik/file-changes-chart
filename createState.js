function isValidNumber(value) {
  return typeof value === "number" && !Number.isNaN(value);
}
function isValidString(value) {
  return typeof value === "string";
}
function isValidBoolean(value) {
  return typeof value === "boolean";
}

function createState(type, defaultValue, config) {
  const state = {
    type: type,
    value: defaultValue,
    ...config, // min, max
    listeners: [],
    getValidDefaultValue: function () {
      if (this.isValidValue(defaultValue)) return defaultValue;
      switch (this.type) {
        case "number":
          return 0;
        case "string":
          return "";
        case "boolean":
          return false;
        default:
          return defaultValue;
      }
    },
    isValidValue: function (value) {
      switch (this.type) {
        case "number":
          return (
            isValidNumber(value) &&
            "min" in this &&
            value >= this.min &&
            "max" in this &&
            value <= this.max
          );
        case "string":
          return isValidString(value) ? value : "";
        case "boolean":
          return isValidBoolean(value) ? value : false;
        default:
          return true;
      }
    },
    set: function (value) {
      this.value = isValidNumber(value) ? value : 0;
      this.listeners.forEach((listener) => listener(value));
    },
    addListener: function (listener) {
      this.listeners.push(listener);
    },
    removeListener: function (listener) {
      this.listeners = this.listeners.filter((l) => l !== listener);
    },
    removeAllListeners: function () {
      this.listeners = [];
    },
  };

  if (!state.isValidValue(defaultValue)) {
    defaultValue = state.getValidDefaultValue();
    state.set(defaultValue);
  }

  return state;
}

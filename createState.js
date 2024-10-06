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
      if (state.isValidValue(defaultValue)) return defaultValue;
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
      switch (state.type) {
        case "number":
          if (!isValidNumber(value)) return false;
          if ("min" in state && value < state.min) return false;
          if ("max" in state && value > state.max) return false;
          return true;
        case "string":
          return isValidString(value) ? value : "";
        case "boolean":
          return isValidBoolean(value) ? value : false;
        default:
          return true;
      }
    },
    set: function (value) {
      state.value = state.isValidValue(value) ? value : 0;
      if (this.updateView) this.updateView(state.value);
      if (state.type === 'string')console.log("state.value change", state.value);
      state.listeners.forEach((listener) => listener(state.value));
    },
    toggle: function () {
      state.set(!state.value);
    },
    addListener: function (listener) {
      state.listeners.push(listener);
    },
    removeListener: function (listener) {
      state.listeners = state.listeners.filter((l) => l !== listener);
    },
    removeAllListeners: function () {
      state.listeners = [];
    },
  };

  if (!state.isValidValue(defaultValue)) {
    defaultValue = state.getValidDefaultValue();
    state.set(defaultValue);
  }

  if (this.updateView) this.updateView(state.value);

  return state;
}

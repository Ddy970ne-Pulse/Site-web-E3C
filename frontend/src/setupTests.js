import "@testing-library/jest-dom";

// jest-environment-jsdom 27 (bundled by react-scripts 5) doesn't expose
// TextEncoder/TextDecoder on the global scope the way real browsers and
// newer jsdom versions do — react-router-dom v7 needs them just to load.
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  Object.assign(global, { TextEncoder, TextDecoder });
}

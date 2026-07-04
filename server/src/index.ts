import "./styles.css";

import BotBuilderApp from "./app";

declare global {
  interface Window {
    Blockly: any;
    App: BotBuilderApp;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new BotBuilderApp("#app");
  app.init();
  window.App = app;
});

export default BotBuilderApp;

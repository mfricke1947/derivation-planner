// Electron does not implement window.prompt(); svg-edit's Deriver extensions rely on it
// (synchronously) to ask for names. Replace it in every frame with a blocking IPC call
// to the main process, which shows a small modal input window.
const { ipcRenderer } = require('electron');

window.prompt = (message, defaultValue) =>
  ipcRenderer.sendSync('deriver-prompt', String(message == null ? '' : message),
                       defaultValue == null ? '' : String(defaultValue));

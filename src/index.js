import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {readMidi} from './midiread.js';

async function text() {
  const eventPipe = {postMessage: console.log};

  const midiInfo = readMidi(
    new Uint8Array(await (await fetch("https://grep32bit.blob.core.windows.net/midi/Beethoven-Symphony5-1.mid")).arrayBuffer())
  );

  runSequence({midiInfo, eventPipe, rootElement: document.querySelector("#root")});
}
// text();
async function runSequence({midiInfo, eventPipe, rootElement}) {
  const timerWorker = new Worker(new URL('./timer.js', import.meta.url))

  ReactDOM.createRoot(rootElement).render(
    React.createElement(App, {
      timerWorker,
      midiInfo,
      eventPipe
    })
  );
}
window.runSequence = runSequence;
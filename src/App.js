import {useCallback, useEffect, useRef, useState} from "react";
import "./App.css";
import {
  CheckboxInput,
  InputWithLabel,
  NumberInput,
  TMInput,
} from "./NumberInput";
import Collapsible from "./collapse";
import {Sequence} from "./sequence";
import {TIMER_STATE, available_btns, cmd2stateChange} from "./constants";
import {readMidi} from "./midiread";
import useTM from "./useTM";
let baseOctave = 42;
const nbars = 1500;
const marginTop = 10;
const pageNotes = [[]];
const micro_s_per_minute = 60000000;
const channels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const bpm2msqn = (bpm, ts) => micro_s_per_minute / bpm / ts;
const msqn2bpm = (msqn, ts) => (micro_s_per_minute / msqn) * ts;
const M_HEIGHT = 3 * window.visualViewport?.height;
console.time("seq-rend");
const ranEvents = [];
const kdMap = new Map();
function App({timerWorker, midiInfo, eventPipe}) {
  const {numerator, denum} = midiInfo.time_base;
  const chRef = useRef([]);
  const [
    tm,
    {setTempo, setTM, setTS1, setTS2},
  ] = useTM({
    ppqn: midiInfo.division,
    msqn: midiInfo.tempos?.[0].tempo || 50000,
    ts: midiInfo.time_base.relative_ts,
    ts1: numerator,
    ts2: denum,
  });
  const {msqn, tempo, ts1, ts2, ts, ppqn} = tm;
  const [compact, setCompact] = useState(false);
  const [tick, setTick] = useState(0);
  const [clock, setClock] = useState(0);

  const [page, setPage] = useState(0);
  const [timerState, setTimerState] = useState(TIMER_STATE.INIT);
  const sequencerRef = useRef();
  let trackCloned = useRef();
  const tempos = midiInfo.tempos;
  const keyDownMap = useRef(new Map());
  useEffect(() => {
    if (timerState != TIMER_STATE.RUNNING) return;
    for (const track of midiInfo.tracks) {
      while (track.length && track[0].t <= tick + 10) {
        const e = track.shift();
        if (e.channel) {
          eventPipe.postMessage(e.channel);
        }
        ranEvents.push(e);
      }
    }
    // drawEventList(ranEvents, kdMap)
  }, [timerState, tick])
  useEffect(() => {
    timerWorker.postMessage({
      tm: {
        timesig: ts,
        ppqn,
        msqn,
      },
    });
  }, [ts, tempo]);
  useEffect(() => {
    timerWorker.addEventListener("message", ({data: {ticks, clock}}) => {
      for (const track of midiInfo.tracks) {
        while (track.length && track[0].t <= ticks) {
          const e = track.shift();
          if (e.meta) console.log(e.meta);
          else eventPipe.postMessage(e.channel);
        }
      }
      if (tempos[1] && ticks > tempos[1].t) {
        setTM({
          ...tm,
          msqn: tempos[1].tempo,
        })
        tempos.shift();
      }
      sequencerRef.current.style.setProperty("--timer-ticks", ticks);
      setTick(ticks);
      setClock(clock);
    });
    trackCloned = midiInfo.tracks;
  }, []);

  useEffect(() => {
    // return;
    for (const events of midiInfo.tracks) {
      const notesDown = new Map();
      drawEventList(events, notesDown);
    }
  }, [midiInfo.tracks]);

  const mkbtn = (cmd) => (
    <input
      type="button"
      key={cmd}
      onClick={() => {
        timerWorker.postMessage({cmd});
        if (Object.keys(cmd2stateChange).indexOf(cmd) > -1) {
          setTimerState(cmd2stateChange[cmd]);
        }
      }}
      value={cmd}
    />
  );
  return (
    <>
      <div>
        <div key="adf">
          {available_btns[timerState].map(mkbtn)}
          <span>          clock: {(clock / 1000).toFixed(2).toString().split(".").join(":")}
          </span>
          <span>Bar: {~~(tick / ppqn)}</span>
          <span>ppqn: {ppqn}</span>
          <Collapsible title="setting">
            <NumberInput
              label="bpm"
              key="adfda"
              onInput={(e) => setTempo(parseInt(e.target.value))}
              value={tempo}
              min={30}
              max={600}
            />
            <NumberInput
              label="timesig"
              onInput={(e) => setTS1(parseInt(e.target.value))}
              value={ts1}
              key="adsf"
              min={2}
              max={8}
            />
          </Collapsible>
        </div>
      </div>
      <div key={1} className="canvas_window">
        <div className="canvas_container" ref={sequencerRef}>
          {channels.map((ch) => (
            <div key={ch} style={{paddingTop: 10}}>
              <Sequence
                ref={(element) => chRef.current.push(element)}
                width={nbars * 40}
                key={ch}
                chId={ch}
                ppqn={ppqn}
                height={M_HEIGHT / 16 - marginTop}
                division={midiInfo.time_base.numerator}
                nbars={nbars}
                nsemi={12 * 3}
                mStart={baseOctave}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
  function drawEventList(events, notesDown) {
    for (const event of events) {
      if (!event.channel) continue;
      const [status, key, vel] = event.channel;
      const cmd = status >> 4,
        ch = status & 0x0f;
      const onNoteUp = (event) => {
        if (notesDown.has(key)) {
          const t2 = event.t;
          const on_env = notesDown.get(key);
          const {val, t1} = on_env;
          chRef.current[ch].drawBarN(t1, t2, key, vel);
          notesDown.delete(key);
        }
      };
      switch (cmd) {
        case 0x09:
          if (vel > 0) notesDown.set(key, {t1: event.t, key, vel});
          else onNoteUp(event);
          break;
        case 0x08:
          onNoteUp(event);
          break;
        default:
          break;
      }
    }
  }
}

export default App;

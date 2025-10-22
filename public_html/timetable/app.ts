import { h, render } from "preact";
import App from "./App.tsx";
// I need tabs!
// student tabs.
// then weeka/weekb/this-week tabs
// timetable should be a table
// with days across the top, timings down the left and timetable in the rows.

async function loadData() {
  const res = await fetch("/api/timetable");
  const text = await res.text();
  const data = JSON.parse(text);
  const html = buildHTML(data);
  document.getElementById("app")!.innerHTML = html;
}

render(h(App, {}), document.getElementById("app"));

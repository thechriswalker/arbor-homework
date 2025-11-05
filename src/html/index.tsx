import { h, render } from "preact";
import { Router, Route, LocationProvider } from "preact-iso";
import Header from "./components/Header.tsx";

import Homework from "./components/homework/Homework.tsx";
import Timetable from "./components/timetable/Timetable.tsx";
import { useEffect } from "preact/hooks";

function Home() {
  useEffect(() => {
    window.location.href = "/homework";
  });
  return (
    <ul>
      <li>
        <a href="homework">Homework</a>
      </li>
      <li>
        <a href="timetable">Timetable</a>
      </li>
    </ul>
  );
}

function App() {
  // we should load the data at this level to prevent unmounts
  // from forgetting it... ideally I'd use localStorage with SWR
  // type loading...

  return (
    <LocationProvider>
      <Header />
      <Router>
        <Route path="/homework" component={Homework} />
        <Route path="/timetable" component={Timetable} />
        <Route path="/" component={Home} />
      </Router>
    </LocationProvider>
  );
}

render(h(App, {}), document.getElementById("app")!);

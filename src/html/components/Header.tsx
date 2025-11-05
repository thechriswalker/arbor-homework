import { BookMarked, CalendarDays, CodeXml } from "lucide-preact";
import { useLocation } from "preact-iso";
import { withTabState } from "../util";
import { useEffect, useState } from "preact/hooks";

export default function Header() {
  const loc = useLocation();

  const isTimetable = loc.path === "/timetable";

  const [homeworkURL, setHomeworkURL] = useState(withTabState("/homework"));
  const [timetableURL, setTimetableURL] = useState(withTabState("/timetable"));
  useEffect(() => {
    const callback = () => {
      setHomeworkURL(withTabState("/homework"));
      setTimetableURL(withTabState("/timetable"));
    };
    window.addEventListener("popstate", callback);
    return () => {
      window.removeEventListener("popstate", callback);
    };
  });

  return (
    <header>
      <ul>
        <li>
          <h1>Arbor</h1>
        </li>
        <li class={isTimetable ? "" : "active"}>
          <a href={withTabState("/homework")} title="homework">
            <BookMarked /> Homework
          </a>
        </li>
        <li class={isTimetable ? "active" : ""}>
          <a href={withTabState("/timetable")} title="timetable">
            <CalendarDays /> Timetable
          </a>
        </li>
      </ul>

      <a
        href="https://github.com/thechriswalker/arbor-homework"
        title="github.com/thechriswalker/arbor-homework"
      >
        <CodeXml />
      </a>
    </header>
  );
}

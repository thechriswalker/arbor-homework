import { getHomework, getHomeworkDetail } from "./src/homework";
import { loginIfNeeded } from "./src/login";
import publicHtml from "./public_html/index.html";
import homeworkHtml from "./public_html/homework/index.html";
import timetableHtml from "./public_html/timetable/index.html";

import { getStudentInfo } from "./src/student";
import { getCalendarAndTimetable } from "./src/calendar";

const baseURL = (process.env.ARBOR_BASEURL ?? "").replace(/\/+$/, ""); // no trailing slash
const username = process.env.ARBOR_USERNAME ?? "";
const password = process.env.ARBOR_PASSWORD ?? "";
const students = (process.env.ARBOR_STUDENTS ?? "")
  .split(",")
  .map((s) => parseInt(s));

if (students.length === 0) {
  throw new Error("no students configured");
}

// wrap into an api
function handleHomeworkAPI(force: boolean) {
  return async () => {
    const session = await loginIfNeeded(baseURL, username, password);
    const records = [];
    for (let studentID of students) {
      const student = await getStudentInfo(session, studentID, force);
      const homework = await getHomework(session, studentID, force);
      for (let work of homework) {
        const detail = await getHomeworkDetail(session, work, force);
        work.detail = detail;
      }
      records.push({ id: studentID, student, homework });
    }
    return Response.json(records);
  };
}

function handleTimetableAPI(force: boolean) {
  return async () => {
    const session = await loginIfNeeded(baseURL, username, password);
    const records = [];
    for (let studentID of students) {
      const student = await getStudentInfo(session, studentID, force);
      const timetable = await getCalendarAndTimetable(
        session,
        studentID,
        force
      );

      records.push({ id: studentID, student, timetable });
    }
    return Response.json(records);
  };
}

const server = Bun.serve({
  routes: {
    "/": publicHtml,
    "/homework": homeworkHtml,
    "/timetable": timetableHtml,
    "/api/homework": handleHomeworkAPI(false),
    "/api/homework/force": handleHomeworkAPI(true),
    "/api/timetable": handleTimetableAPI(false),
    "/health": () => Response.json({ ok: true }),
    "/*": () =>
      Response.json({ status: 404, error: "not found" }, { status: 404 }),
  },
  development: process.env.DEV === "true",
});

console.log(`Server listening at: http://localhost:${server.port}/`);

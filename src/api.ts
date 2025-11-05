import { getCalendarAndTimetable } from "./calendar";
import { getHomework, getHomeworkDetail } from "./homework";
import { loginIfNeeded } from "./login";
import { getStudentInfo } from "./student";

import app from "./html/index.html";
import type { HomeworkAPIResponse, TimetableAPIResponse } from "./types";

export default function bootstrap(
  baseURL: string,
  username: string,
  password: string,
  students: Array<number>
) {
  // wrap into an api
  function handleHomeworkAPI(force: boolean) {
    return async () => {
      const session = await loginIfNeeded(baseURL, username, password);
      const records: HomeworkAPIResponse = [];
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
      const records: TimetableAPIResponse = [];
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
      "/*": app,
      // "/homework": homeworkHtml,
      // "/timetable": timetableHtml,
      "/api/homework": handleHomeworkAPI(false),
      "/api/homework/force": handleHomeworkAPI(true),
      "/api/timetable": handleTimetableAPI(false),
      "/health": () => Response.json({ ok: true }),
      // "/*": () =>
      //   Response.json({ status: 404, error: "not found" }, { status: 404 }),
    },
    development: process.env.DEV === "true",
  });

  console.log(`Server listening at: http://localhost:${server.port}/`);
}

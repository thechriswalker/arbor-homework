import { getCalendarAndTimetable } from "./calendar";
import { getHomework, getHomeworkDetail } from "./homework";
import { loginIfNeeded } from "./login";
import { getStudentInfo } from "./student";

import app from "./html/index.html";
import type { HomeworkAPIResponse, TimetableAPIResponse } from "./types";
import type { BunRequest } from "bun";
import { sql } from "./db";

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
        records.push({
          id: studentID,
          student: {
            ...student,
            img: "/api/pic/" + studentID,
          },
          homework,
        });
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

        records.push({
          id: studentID,
          student: {
            ...student,
            img: "/api/pic/" + studentID,
          },
          timetable,
        });
      }
      return Response.json(records);
    };
  }

  const handleProfilePic = async (req: BunRequest<"/api/pic/:id">) => {
    // check profile pic cache a super long cache and a slightly different
    const studentID = parseInt(req.params.id, 10);
    const db = await sql;
    let rows =
      await db`SELECT mime, data FROM profile_pics WHERE id = ${studentID};`;
    if (rows.length === 0) {
      const session = await loginIfNeeded(baseURL, username, password);
      const student = await getStudentInfo(session, studentID, true);
      // now fetch the data
      const res = await fetch(student.img, {
        headers: { cookie: `mis=${session.id}` },
      });
      if (res.ok) {
        const data = await res.arrayBuffer();
        const b64 = new Uint8Array(data).toBase64();
        const mime = res.headers.get("content-type") || "";
        await db`INSERT INTO profile_pics (id, mime, data) VALUES (${studentID}, ${mime}, ${b64});`;

        return new Response(data, { headers: { "content-type": mime } });
      }
      throw new Error("failed to get profile pic");
    }
    return new Response(Uint8Array.fromBase64(rows[0].data), {
      headers: { "content-type": rows[0].mime },
    });
  };

  const server = Bun.serve({
    routes: {
      "/*": app,
      // "/homework": homeworkHtml,
      // "/timetable": timetableHtml,
      "/api/pic/:id": handleProfilePic,
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

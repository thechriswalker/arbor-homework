import { getHomework, getHomeworkDetail } from "./src/homework";
import { loginIfNeeded } from "./src/login";
import publicHtml from "./public_html/index.html";
import { getStudentInfo } from "./src/student";

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

const server = Bun.serve({
  routes: {
    "/": publicHtml,
    "/api/homework": handleHomeworkAPI(false),
    "/api/homework/force": handleHomeworkAPI(true),
    "/health": () => Response.json({ ok: true }),
    "/*": () =>
      Response.json({ status: 404, error: "not found" }, { status: 404 }),
  },
});

console.log(`Server listening at: http://localhost:${server.port}/`);

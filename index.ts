import { getHomework, getHomeworkDetail } from "./src/homework";
import { loginIfNeeded } from "./src/login";
import app from "./src/html/index.html";
import { getStudentInfo } from "./src/student";
import { getCalendarAndTimetable } from "./src/calendar";
import bootstrap from "src/api";

const baseURL = (process.env.ARBOR_BASEURL ?? "").replace(/\/+$/, ""); // no trailing slash
const username = process.env.ARBOR_USERNAME ?? "";
const password = process.env.ARBOR_PASSWORD ?? "";
const students = (process.env.ARBOR_STUDENTS ?? "")
  .split(",")
  .map((s) => parseInt(s));

if (students.length === 0) {
  throw new Error("no students configured");
}

bootstrap(baseURL, username, password, students);

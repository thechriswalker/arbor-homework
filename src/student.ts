import sanitize from "sanitize-html";
import { createAPIFunction } from "./arbor";
import type { StudentInfo } from "./types";
// we can cache this a long time!
const STUDENT_INFO_CACHE = 1 * 3600_000;

export const getStudentInfo = createAPIFunction(
  "students",
  (studentID: number) =>
    `/guardians/home-ui/dashboard/student-id/${studentID}?format=javascript`,
  extractStudentInfo,
  STUDENT_INFO_CACHE
);

function extractStudentInfo(resp: any): StudentInfo {
  let student: StudentInfo | null = null;
  resp.content?.forEach((x: any) => {
    if (x.componentName === "Arbor.container.WidgetZoneColumn") {
      x.content?.forEach((y: any) => {
        if (y.componentName === "Arbor.container.InfoPanel") {
          // probably this one.
          // check the props.
          const props = y.props ?? { properties: [] };
          if ("picture" in props && props?.properties?.[0]?.label === "Form") {
            // seems like this one.
            student = {
              name: sanitize(y.props?.title ?? "", {
                allowedTags: [],
                allowedAttributes: {},
              }),
              img: props.picture,
              form: props.properties?.[0].value ?? "",
            };
          }
        }
      });
    }
  });
  if (student === null) {
    throw new Error("Student Not Found!");
  }
  return student;
}

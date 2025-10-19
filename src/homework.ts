import { createAPIFunction } from "./api";
import sanitizeHTML from "sanitize-html";

const titles = [
  "Overdue Assignments",
  "Submitted Assignments",
  "Assignments that are due",
];

export type Homework = {
  id: string;
  //url: string;
  isDone: boolean;
  subject: string;
  status: string;
  dueDate: Date;
  detail: HomeworkDetail | null;
};

// lets use a regex! ;)
const reParseHomeworkHTML =
  /<b>([^<]+)<\/b>.*\(Due ([0-9]{2}) ([A-Z][a-z]+) (202[5-9])\)/;
function parseHomework(line: string): { subject: string; dueDate: Date } {
  line = line.replaceAll(/[\r\n\t\s]+/g, " ");
  const matches = line.match(reParseHomeworkHTML);
  // console.log(line, " => ", re.test(line), matches);
  if (matches === null) {
    throw new Error("bad line:: " + line);
  }
  const [_, subject, day, month, year] = matches;
  const dueDate = new Date(`${year} ${month} ${day} 00:00:00 UTC`);

  return { subject: sanitize(subject), dueDate };
}
// https://cullompton-community-college.uk.arbor.education/guardians/home-ui/dashboard/student-id/4226?format=javascript
export const getHomework = createAPIFunction(
  (studentID: number) =>
    `/guardians/home-ui/dashboard/student-id/${studentID}?format=javascript`,
  extractHomework
);

const homeworkSanitizerOptions = {
  allowedTags: ["b", "i", "em", "strong", "a", "p", "li", "ul", "ol", "img"],
  allowedAttributes: {
    a: ["href"],
    img: ["src", "alt"],
  },
  allowedSchemes: sanitizeHTML.defaults.allowedSchemes.concat(["data"]),
};
function sanitize(dirty: string) {
  return sanitizeHTML(dirty, homeworkSanitizerOptions);
}

export function extractHomework(resp: any): Array<Homework> {
  const homework: Array<Homework> = [];
  resp?.content?.forEach((x: any) => {
    if (x.componentName === "Arbor.container.Column") {
      x.content.forEach((y: any) => {
        if (y.componentName === "Arbor.container.Section") {
          const title = y.props?.title ?? "";
          if (titles.includes(title)) {
            y.content?.forEach((z: any) => {
              if (z.componentName === "Arbor.container.PropertyRow") {
                const { subject, dueDate } = parseHomework(
                  (z.props as any).value as string
                );
                const isDone = (z.props as any).description.includes(
                  "Submitted"
                );
                const work = {
                  id: z.props.url.split("schoolwork-id/")[1].split("/")[0],
                  //url: z.props.url,
                  isDone,
                  subject,
                  dueDate,
                  status: (z.props as any).description,
                  detail: null,
                };
                homework.push(work);
              }
            });
          }
        }
      });
    }
  });
  homework.sort((a, z) => {
    return a.dueDate.getTime() - z.dueDate.getTime();
  });
  // we only return homework that is not handed in yet, or not yet due
  const now = Date.now();
  return homework.filter((x) => {
    // I am also
    const notDoneOrStillDue = x.dueDate.getTime() > now || !x.isDone;
    const veryOld = x.dueDate.getTime() < now - 10 * 86400_000;
    return !veryOld && notDoneOrStillDue;
  });
}

// more detail at: https://cullompton-community-college.uk.arbor.education/guardians/student-ui/schoolwork-overview/schoolwork-id/${schoolworkID}?format=javascript

// including "Instructions"
// but we have to "N+1" to get it.
// so probably best to fetch them sparingly and cache locally.
// NB access tokens allow access to all homework, so I could literally scrape all of them.
// the use incrementing numerical ids.

type HomeworkDetail = {
  instructions: string;
};
const HOMEWORK_DETAIL_CACHE_DURATION = 7 * 86400_000;
export const getHomeworkDetail = createAPIFunction(
  (homework: Homework) =>
    `/guardians/student-ui/schoolwork-overview/schoolwork-id/${homework.id}?format=javascript`,
  extractHomeworkDetail,
  HOMEWORK_DETAIL_CACHE_DURATION
);

function extractHomeworkDetail(obj: any): HomeworkDetail {
  const detail: HomeworkDetail = { instructions: "<empty>" };
  obj?.content?.forEach((x: any) => {
    // pick out the column first, then the section.
    if (x.componentName === "Arbor.container.Column") {
      x.content?.forEach((y: any) => {
        if (
          y.componentName === "Arbor.container.Section" &&
          y?.props?.title === "Student Instructions"
        ) {
          // find the row with the instructions and grab them.
          y.content?.forEach((z: any) => {
            if (z.props?.fieldLabel === "Instructions") {
              detail.instructions = sanitize(z.props?.value ?? "");
              // console.log(detail)
            }
          });
        }
      });
    }
  });
  return detail;
}

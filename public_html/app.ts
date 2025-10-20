async function loadData() {
  clearTimeout(dueDateUpdate!);

  const res = await fetch("/api/homework");
  const text = await res.text();
  const data = JSON.parse(text, (k, v) => {
    if (k === "dueDate") {
      return new Date(v);
    }
    return v;
  });
  const html = buildHTML(data);
  document.getElementById("app")!.innerHTML = html;
  triggerDueDateUpdate();
}

document.addEventListener("DOMContentLoaded", loadData);

type HomeworkData = {
  id: number; // student ID
  student: { name: string; img: string; form: string };
  homework: Array<Homework>;
};
type Homework = {
  id: string;
  subject: string;
  detail: null | { instructions: string };
  dueDate: Date;
  isDone: boolean;
  status: string;
};

function buildHTML(data: Array<HomeworkData>): string {
  return data.map(buildSection).join("\n");
}

function buildSection({ id, student, homework }: HomeworkData): string {
  return `<section class="column" id="student-${id}">
        <h2><img class="profile-pic" src="${student.img}" /> ${student.name} (${
    student.form
  })</h2>
        ${homework.map(buildHomework).join("\n")}
    </section>`;
}

function buildHomework(work: Homework): string {
  return `<div class="homework-card ${work.isDone ? "is-done" : ""}">
        <h3>${work.subject}</h3>
        <p>Due <time class="due" datetime="${work.dueDate.toISOString()}"></time> (${work.dueDate.toLocaleDateString()}) [${
    work.status
  }]</p><div class="instructions">
        ${work.detail?.instructions ?? ""}
    </div></div>`;
}

let dueDateUpdate: NodeJS.Timeout | null = null;
function triggerDueDateUpdate() {
  clearTimeout(dueDateUpdate!);
  doDueDateUpdate();
  dueDateUpdate = setTimeout(triggerDueDateUpdate, 10 * 60_000);
}

const relTime = new Intl.RelativeTimeFormat();
function doDueDateUpdate() {
  const cards = document.querySelectorAll(".homework-card");
  const now = Date.now();
  const classes = ["is-late", "is-due-soon"];
  cards.forEach((card) => {
    card.classList.remove(...classes);
    const el = card.querySelector("time.due")! as HTMLTimeElement;
    const due = new Date(el.dateTime);
    const daysTilDue = Math.ceil((due.getTime() - now) / 86400_000);
    if (daysTilDue <= 0) {
      card.classList.add("is-late");
    } else if (daysTilDue <= 2) {
      card.classList.add("is-due-soon");
    }
    el.textContent =
      daysTilDue === 0 ? "today" : relTime.format(daysTilDue, "days");
  });
}

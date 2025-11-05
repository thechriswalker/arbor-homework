import type { Homework, HomeworkAPIResponse } from "src/types";
import { Tab, Tabs } from "../tabs/Tabs";
import { Avatar } from "../Avatar";
import { cx } from "../../util";
import useSWR from "preact-swr";
import { useEffect, useState } from "preact/hooks";
import Loading from "../Loading";

async function loadData() {
  const res = await fetch("/api/homework");
  const text = await res.text();
  const data = JSON.parse(text, (k, v) => {
    if (k === "dueDate") {
      return new Date(v);
    }
    return v;
  });
  return data as HomeworkAPIResponse;
}

export default function Homework() {
  const [initialLoad, setInitialLoad] = useState(true);
  const { error, data, mutate } = useSWR("homework", loadData, {
    revalidateOnMount: false,
  });
  useEffect(() => {
    if (initialLoad && !data) {
      mutate(undefined, true);
      setInitialLoad(false);
    }
  }, [initialLoad]);

  if (error) {
    return (
      <div class="error">
        <p>An error occurred :(</p>
        <p class="msg">{error.message}</p>
      </div>
    );
  }
  if (!data) {
    return <Loading />;
  }
  return (
    <Tabs qs="student">
      {data?.map((data) => {
        return (
          <Tab
            id={data.id.toString()}
            label={
              <Avatar
                img={data.student.img}
                name={data.student.name}
                form={data.student.form}
              />
            }
          >
            {data.homework.map((h) => (
              <HomeworkItem work={h} key={h.id} />
            ))}
          </Tab>
        );
      })}
    </Tabs>
  );
}

type HomeworkProps = {
  work: Homework;
};

// JS Date.getDay returns 0 for Sunday
const DAYS = ["Sun", "Mon", "Tues", "Wed", "Thu", "Fri", "Sat"];

function HomeworkItem({ work }: HomeworkProps) {
  const now = Date.now();
  const daystilDue = Math.ceil((work.dueDate.getTime() - now) / 86400_000);

  // work out class by how late or done it is.
  const classes = {
    "is-done": work.isDone,
    "is-due-soon": daystilDue > 0 && daystilDue <= 2,
    "is-late": daystilDue <= 0,
  };

  let dueText = "";
  switch (daystilDue) {
    case 0:
      dueText = "TODAY!";
      break;
    case 1:
      dueText = "tomorrow";
      break;
    case -1:
      dueText = "yesterday";
      break;
    default:
      if (daystilDue < 0) {
        dueText = `${Math.abs(daystilDue)} days ago`;
      } else {
        dueText = `in ${daystilDue} days`;
      }
  }

  return (
    <div class={cx("homework-card", classes)}>
      <h3>{work.subject}</h3>
      <p>
        Due{" "}
        <time class="due" datetime={work.dueDate.toISOString()}>
          {dueText}
        </time>{" "}
        ({DAYS[work.dueDate.getDay()]} {work.dueDate.toLocaleDateString()}) [
        {work.status}]
      </p>
      <div
        class="instructions"
        dangerouslySetInnerHTML={{ __html: work.detail?.instructions ?? "" }}
      ></div>
    </div>
  );
}

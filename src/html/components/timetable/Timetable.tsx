import type { TimetableAPIResponse, Week } from "src/types";
import { Tab, Tabs } from "../tabs/Tabs";
import { Avatar } from "../Avatar";
import useSWR from "preact-swr";
import { useEffect, useState } from "preact/hooks";
import Loading from "../Loading";
import { cx } from "src/html/util";

async function loadData() {
  const res = await fetch("/api/timetable");
  const text = await res.text();
  const data = JSON.parse(text);
  return data as TimetableAPIResponse;
}

export default function Homework() {
  const [initialLoad, setInitialLoad] = useState(true);
  const { error, data, mutate } = useSWR("timetable", loadData, {
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
    <div class="timetable-section">
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
              <Tabs qs="week">
                {data.timetable.map((h) => (
                  <Tab id={h.id} label={h.name}>
                    <Calendar week={h} />
                  </Tab>
                ))}
              </Tabs>
            </Tab>
          );
        })}
      </Tabs>
    </div>
  );
}

function Calendar({ week }: { week: Week }) {
  // Table:
  // Days along the top
  // Each cell is a period.
  // So the data is in the wrong shape.
  // we have an array of days which have an array of periods.
  // but we want to iterate periods for each day.
  const maxPeriods = week.days.reduce((acc, day) => {
    return Math.max(acc, day.length);
  }, 0);
  const today = new Date().getDay();
  return (
    <div class={"timetable today-" + today}>
      <h3>Monday</h3>
      <h3>Tuesday</h3>
      <h3>Wednesday</h3>
      <h3>Thursday</h3>
      <h3>Friday</h3>

      {Array.from({ length: maxPeriods }).map((_, i) => {
        return (
          <>
            {week.days.map((day, j) => {
              // if the day has the period add it, otherwise add an empty cell
              // class is day- (j+1) because days start on sunday in JS, and monday here.
              const data = day[i];
              return (
                <div class={cx("day-" + (j + 1), { empty: !data })}>
                  {data && (
                    <>
                      <p
                        class="subject"
                        dangerouslySetInnerHTML={{ __html: data.subject }}
                      ></p>
                      <p class="group">{data.group}</p>
                      <p class="timing">{data.timing}</p>
                    </>
                  )}
                </div>
              );
            })}
          </>
        );
      })}
    </div>
  );
}

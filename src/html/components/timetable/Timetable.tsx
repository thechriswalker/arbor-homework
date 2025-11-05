import type { TimetableAPIResponse, Week } from "src/types";
import { Tab, Tabs } from "../tabs/Tabs";
import { Avatar } from "../Avatar";
import useSWR from "preact-swr";
import { useEffect, useState } from "preact/hooks";
import Loading from "../Loading";

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
    <table class={"timetable today-" + today}>
      <thead>
        <tr>
          <th>Monday</th>
          <th>Tuesday</th>
          <th>Wednesday</th>
          <th>Thursday</th>
          <th>Friday</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: maxPeriods }).map((_, i) => {
          return (
            <tr>
              {week.days.map((day) => {
                // if the day has the period add it, otherwise add an empty cell.
                const data = day[i];
                return (
                  <td>
                    {data && (
                      <div>
                        <p
                          class="subject"
                          dangerouslySetInnerHTML={{ __html: data.subject }}
                        ></p>
                        <p class="group">{data.group}</p>
                        <p class="timing">{data.timing}</p>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

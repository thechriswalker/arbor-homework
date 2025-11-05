// what questions do we want to ask?
// Show Week A / Week B calendar
// like:
/*
    timetable: {
      week_a: [
        [monday_period_1, monday_period_2, ...],
        [tuesday, ....]
        ...
      ],
      week_b: [
        like above
      ]
    },
    calendar: [{
        week_beginning: "2025-10-20",
        kind: "a|b|off",
        days: [[],[]] // like the timetable layout.
    }]
      
*/
//    to get the data we call (yes, a POST desipte the URL being "static")
//
// POST https://cullompton-community-college.uk.arbor.education/calendar-entry/list-static/format/json/
//
/*
{"action_params":{
    "view":"multiday","startDate":"2026-03-16","endDate":"2026-03-20","filters":[
        {"field_name":"object","value":{"_objectTypeId":1,"_objectId":3822}}
    ]}
}
*/
// basically to pull a students calendar we need a good chunk of the calendar.
// 2 months, should be enough to get "week_a" and "week_b", as well as the current week.
// We should have a generic week A/B listing as well as the current week.

import { createAPIFunction } from "./arbor";
import type { Week } from "./types";
// the UI pulls the current week by default startDate = monday, endDate = friday
// Then we get a result with the week and 3 weeks either side.
// the data is in an HTML table... in each week's entry...

export const getCalendarAndTimetable = createAPIFunction(
  (studentId: number) => {
    const { startDate, endDate } = getCurrentWeek();
    const body = {
      action_params: {
        view: "multiday",
        startDate,
        endDate,
        filters: [
          {
            field_name: "object",
            value: { _objectTypeId: 1, _objectId: studentId },
          },
        ],
      },
    };

    return {
      endpoint: "/calendar-entry/list-static/format/json/",
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    };
  },
  extractCalendarData,
  7 * 86400_000
);

function getCurrentWeek() {
  let endDate = new Date();
  // endDate = new Date("2025-11-23T12:00:00Z"); // for testing

  // find next friday and work back to monday.
  while (endDate.getDay() !== 5) {
    // I hate DST and all that crap, so lets do this in 6 hour chunks...
    endDate = new Date(endDate.getTime() + 6 * 3600_000);
  }
  let startDate = endDate;
  while (startDate.getDay() !== 1) {
    startDate = new Date(startDate.getTime() - 6 * 3600_000);
  }

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

type ResponsePage = {
  start: string;
  end: string;
  html?: string;
  title: string;
};

function extractCalendarData(obj: any) {
  const pages = obj.items?.[0]?.fields?.response?.value?.pages ?? [];
  const weekA: Week = {
    id: "week_a",
    name: "Week A",
    days: [],
  };
  const weekB: Week = {
    id: "week_b",
    name: "Week B",
    days: [],
  };
  const thisWeek: Week = {
    id: "current",
    name: "This Week",
    days: [],
  };
  const currentWeek = getCurrentWeek();

  pages.forEach((x: ResponsePage) => {
    if (!x.html) {
      return;
    }
    // find out if this is a week a or week b or thsi current week (or both)
    const isWeekA = x.title.includes("Week A");
    const needWeekA = isWeekA && weekA.days.length === 0;
    const isWeekB = x.title.includes("Week B");
    const needWeekB = isWeekB && weekB.days.length === 0;
    const isCurrentWeek =
      currentWeek.startDate === x.start && currentWeek.endDate === x.end;

    if (!needWeekA && !needWeekB && !isCurrentWeek) {
      return;
    }

    // it is one of them, let's parse the HTML table for the data.
    const days = parseTimetable(x.html);
    if (days.length === 0) {
      // bad parse.
      return;
    }
    if (needWeekA) {
      weekA.days.push(...days);
    }
    if (needWeekB) {
      weekB.days.push(...days);
    }
    if (isCurrentWeek) {
      if (isWeekA) {
        thisWeek.name += " (Week A)";
      }
      if (isWeekB) {
        thisWeek.name += " (Week B)";
      }
      thisWeek.days.push(...days);
    }
  });
  return [thisWeek, weekA, weekB];
}

// sample:
//<div style="position:relative">
//     <table class="mis-cal mis-cal-day">
//         <thead>
//         <tr>
//             <td style="width:16.666666666667%"></td>
//             <td style="width:16.666666666667%" class="mis-calendar-date" data-date="2025-10-13"><b>13</b> Monday</td><td style="width:16.666666666667%" class="mis-calendar-date" data-date="2025-10-14"><b>14</b> Tuesday</td><td style="width:16.666666666667%" class="mis-calendar-date" data-date="2025-10-15"><b>15</b> Wednesday</td><td style="width:16.666666666667%" class="mis-calendar-date" data-date="2025-10-16"><b>16</b> Thursday</td><td style="width:16.666666666667%" class="mis-calendar-date" data-date="2025-10-17"><b>17</b> Friday</td>        </tr>
//         </thead>
//         <tbody>
//         <tr>
//             <td style="height:0;padding:0"></td>
//             <td style="height:0;padding:0"><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2617899" data-eventid="2617899" class="mis-cal-event mis-cal-4  mis-cal-event-small" style="width:8.3333333333333%;margin-left:0%;;top:80px;height:22px"><div class="mis-cal-event-time" data-eventid="2617899" style="height:21px;overflow:hidden"><span  data-eventid="2617899">08:40-09:00</span></div><span style="height:1px;" data-eventid="2617899"><b class="title" data-eventid="2617899">9: 9HAN</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2131859" data-eventid="2131859" class="mis-cal-event mis-cal-4 " style="width:8.3333333333333%;margin-left:8.3333333333333%;;top:100px;height:59px"><div class="mis-cal-event-time" data-eventid="2131859" style="height:21px;overflow:hidden"><span  data-eventid="2131859">09:00-09:59</span></div><span style="height:38px;" data-eventid="2131859"><b class="title" data-eventid="2131859">Computing: Yr 9: 9Y/Cy</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2011286" data-eventid="2011286" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:160px;height:59px"><div class="mis-cal-event-time" data-eventid="2011286" style="height:21px;overflow:hidden"><span  data-eventid="2011286">10:00-10:59</span></div><span style="height:38px;" data-eventid="2011286"><b class="title" data-eventid="2011286">Science: Yr 9: 9A/Sc2</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2135542" data-eventid="2135542" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:250px;height:59px"><div class="mis-cal-event-time" data-eventid="2135542" style="height:21px;overflow:hidden"><span  data-eventid="2135542">11:30-12:29</span></div><span style="height:38px;" data-eventid="2135542"><b class="title" data-eventid="2135542">History: Yr 9: 9Y/Hi</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2126147" data-eventid="2126147" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:311px;height:58px"><div class="mis-cal-event-time" data-eventid="2126147" style="height:21px;overflow:hidden"><span  data-eventid="2126147">12:31-13:29</span></div><span style="height:37px;" data-eventid="2126147"><b class="title" data-eventid="2126147">Design &amp; T: Yr 9: 9Y/Dt</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/1984261" data-eventid="1984261" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:400px;height:59px"><div class="mis-cal-event-time" data-eventid="1984261" style="height:21px;overflow:hidden"><span  data-eventid="1984261">14:00-14:59</span></div><span style="height:38px;" data-eventid="1984261"><b class="title" data-eventid="1984261">Maths: Yr 9: 9A/Ma1</b></span></div></td><td style="height:0;padding:0"><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2659490" data-eventid="2659490" class="mis-cal-event mis-cal-4  mis-cal-event-small" style="width:8.3333333333333%;margin-left:0%;;top:80px;height:22px"><div class="mis-cal-event-time" data-eventid="2659490" style="height:21px;overflow:hidden"><span  data-eventid="2659490">08:40-09:00</span></div><span style="height:1px;" data-eventid="2659490"><b class="title" data-eventid="2659490">9: 9HAN</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/1970257" data-eventid="1970257" class="mis-cal-event mis-cal-4 " style="width:8.3333333333333%;margin-left:8.3333333333333%;;top:100px;height:59px"><div class="mis-cal-event-time" data-eventid="1970257" style="height:21px;overflow:hidden"><span  data-eventid="1970257">09:00-09:59</span></div><span style="height:38px;" data-eventid="1970257"><b class="title" data-eventid="1970257">English La: Yr 9: 9A/En1</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/1987512" data-eventid="1987512" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:160px;height:59px"><div class="mis-cal-event-time" data-eventid="1987512" style="height:21px;overflow:hidden"><span  data-eventid="1987512">10:00-10:59</span></div><span style="height:38px;" data-eventid="1987512"><b class="title" data-eventid="1987512">Maths: Yr 9: 9A/Ma1</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2137531" data-eventid="2137531" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:250px;height:59px"><div class="mis-cal-event-time" data-eventid="2137531" style="height:21px;overflow:hidden"><span  data-eventid="2137531">11:30-12:29</span></div><span style="height:38px;" data-eventid="2137531"><b class="title" data-eventid="2137531">German: Yr 9: 9Y/Gm</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/1990665" data-eventid="1990665" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:311px;height:58px"><div class="mis-cal-event-time" data-eventid="1990665" style="height:21px;overflow:hidden"><span  data-eventid="1990665">12:31-13:29</span></div><span style="height:37px;" data-eventid="1990665"><b class="title" data-eventid="1990665">PE: Yr 9: 9A/Pe1</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2123082" data-eventid="2123082" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:400px;height:59px"><div class="mis-cal-event-time" data-eventid="2123082" style="height:21px;overflow:hidden"><span  data-eventid="2123082">14:00-14:59</span></div><span style="height:38px;" data-eventid="2123082"><b class="title" data-eventid="2123082">Art &amp; Desi: Yr 9: 9Y/Ar</b></span></div></td><td style="height:0;padding:0"><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2694523" data-eventid="2694523" class="mis-cal-event mis-cal-4  mis-cal-event-small" style="width:8.3333333333333%;margin-left:0%;;top:80px;height:22px"><div class="mis-cal-event-time" data-eventid="2694523" style="height:21px;overflow:hidden"><span  data-eventid="2694523">08:40-09:00</span></div><span style="height:1px;" data-eventid="2694523"><b class="title" data-eventid="2694523">9: 9HAN</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/1997145" data-eventid="1997145" class="mis-cal-event mis-cal-4 " style="width:8.3333333333333%;margin-left:8.3333333333333%;;top:100px;height:59px"><div class="mis-cal-event-time" data-eventid="1997145" style="height:21px;overflow:hidden"><span  data-eventid="1997145">09:00-09:59</span></div><span style="height:38px;" data-eventid="1997145"><b class="title" data-eventid="1997145">PE: Yr 9: 9A/Pe1</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2139907" data-eventid="2139907" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:160px;height:59px"><div class="mis-cal-event-time" data-eventid="2139907" style="height:21px;overflow:hidden"><span  data-eventid="2139907">10:00-10:59</span></div><span style="height:38px;" data-eventid="2139907"><b class="title" data-eventid="2139907">Geography: Yr 9: 9Y/Ge</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/1973250" data-eventid="1973250" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:250px;height:59px"><div class="mis-cal-event-time" data-eventid="1973250" style="height:21px;overflow:hidden"><span  data-eventid="1973250">11:30-12:29</span></div><span style="height:38px;" data-eventid="1973250"><b class="title" data-eventid="1973250">English La: Yr 9: 9A/En1</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2141603" data-eventid="2141603" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:311px;height:58px"><div class="mis-cal-event-time" data-eventid="2141603" style="height:21px;overflow:hidden"><span  data-eventid="2141603">12:31-13:29</span></div><span style="height:37px;" data-eventid="2141603"><b class="title" data-eventid="2141603">RE: Yr 9: 9Y/Re</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/1986003" data-eventid="1986003" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:400px;height:59px"><div class="mis-cal-event-time" data-eventid="1986003" style="height:21px;overflow:hidden"><span  data-eventid="1986003">14:00-14:59</span></div><span style="height:38px;" data-eventid="1986003"><b class="title" data-eventid="1986003">Maths: Yr 9: 9A/Ma1</b></span></div></td><td style="height:0;padding:0"><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2649663" data-eventid="2649663" class="mis-cal-event mis-cal-4  mis-cal-event-small" style="width:8.3333333333333%;margin-left:0%;;top:80px;height:22px"><div class="mis-cal-event-time" data-eventid="2649663" style="height:21px;overflow:hidden"><span  data-eventid="2649663">08:40-09:00</span></div><span style="height:1px;" data-eventid="2649663"><b class="title" data-eventid="2649663">9: 9HAN</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2132890" data-eventid="2132890" class="mis-cal-event mis-cal-4 " style="width:8.3333333333333%;margin-left:8.3333333333333%;;top:100px;height:59px"><div class="mis-cal-event-time" data-eventid="2132890" style="height:21px;overflow:hidden"><span  data-eventid="2132890">09:00-09:59</span></div><span style="height:38px;" data-eventid="2132890"><b class="title" data-eventid="2132890">Drama: Yr 9: 9Y/Dr</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2137739" data-eventid="2137739" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:160px;height:59px"><div class="mis-cal-event-time" data-eventid="2137739" style="height:21px;overflow:hidden"><span  data-eventid="2137739">10:00-10:59</span></div><span style="height:38px;" data-eventid="2137739"><b class="title" data-eventid="2137739">History: Yr 9: 9Y/Hi</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2011237" data-eventid="2011237" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:250px;height:59px"><div class="mis-cal-event-time" data-eventid="2011237" style="height:21px;overflow:hidden"><span  data-eventid="2011237">11:30-12:29</span></div><span style="height:38px;" data-eventid="2011237"><b class="title" data-eventid="2011237">Science: Yr 9: 9A/Sc2</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2139064" data-eventid="2139064" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:311px;height:58px"><div class="mis-cal-event-time" data-eventid="2139064" style="height:21px;overflow:hidden"><span  data-eventid="2139064">12:31-13:29</span></div><span style="height:37px;" data-eventid="2139064"><b class="title" data-eventid="2139064">Geography: Yr 9: 9Y/Ge</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/1977453" data-eventid="1977453" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:400px;height:59px"><div class="mis-cal-event-time" data-eventid="1977453" style="height:21px;overflow:hidden"><span  data-eventid="1977453">14:00-14:59</span></div><span style="height:38px;" data-eventid="1977453"><b class="title" data-eventid="1977453">English La: Yr 9: 9A/En1</b></span></div></td><td style="height:0;padding:0"><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2711582" data-eventid="2711582" class="mis-cal-event mis-cal-4  mis-cal-event-small" style="width:8.3333333333333%;margin-left:0%;;top:80px;height:22px"><div class="mis-cal-event-time" data-eventid="2711582" style="height:21px;overflow:hidden"><span  data-eventid="2711582">08:40-09:00</span></div><span style="height:1px;" data-eventid="2711582"><b class="title" data-eventid="2711582">9: 9HAN</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/1973627" data-eventid="1973627" class="mis-cal-event mis-cal-4 " style="width:8.3333333333333%;margin-left:8.3333333333333%;;top:100px;height:59px"><div class="mis-cal-event-time" data-eventid="1973627" style="height:21px;overflow:hidden"><span  data-eventid="1973627">09:00-09:59</span></div><span style="height:38px;" data-eventid="1973627"><b class="title" data-eventid="1973627">English La: Yr 9: 9A/En1</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2003386" data-eventid="2003386" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:160px;height:59px"><div class="mis-cal-event-time" data-eventid="2003386" style="height:21px;overflow:hidden"><span  data-eventid="2003386">10:00-10:59</span></div><span style="height:38px;" data-eventid="2003386"><b class="title" data-eventid="2003386">Science: Yr 9: 9A/Sc2</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2138785" data-eventid="2138785" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:250px;height:59px"><div class="mis-cal-event-time" data-eventid="2138785" style="height:21px;overflow:hidden"><span  data-eventid="2138785">11:30-12:29</span></div><span style="height:38px;" data-eventid="2138785"><b class="title" data-eventid="2138785">Music: Yr 9: 9Y/Mu</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/2128933" data-eventid="2128933" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:311px;height:58px"><div class="mis-cal-event-time" data-eventid="2128933" style="height:21px;overflow:hidden"><span  data-eventid="2128933">12:31-13:29</span></div><span style="height:37px;" data-eventid="2128933"><b class="title" data-eventid="2128933">German: Yr 9: 9Y/Gm</b></span></div><div data-ot="a" data-ot-style="ajax" ajax-link="/guardians/calendar-entry/tooltip/id/1979458" data-eventid="1979458" class="mis-cal-event mis-cal-4 " style="width:16.666666666667%;margin-left:0%;;top:400px;height:59px"><div class="mis-cal-event-time" data-eventid="1979458" style="height:21px;overflow:hidden"><span  data-eventid="1979458">14:00-14:59</span></div><span style="height:38px;" data-eventid="1979458"><b class="title" data-eventid="1979458">Maths: Yr 9: 9A/Ma1</b></span></div></td>        </tr>
//         <tr><td><span>08:00</span></td><td data-datetime="2025-10-13 08:00:00"></td><td data-datetime="2025-10-14 08:00:00"></td><td data-datetime="2025-10-15 08:00:00"></td><td data-datetime="2025-10-16 08:00:00"></td><td data-datetime="2025-10-17 08:00:00"></td></tr><tr><td><span>09:00</span></td><td data-datetime="2025-10-13 09:00:00"></td><td data-datetime="2025-10-14 09:00:00"></td><td data-datetime="2025-10-15 09:00:00"></td><td data-datetime="2025-10-16 09:00:00"></td><td data-datetime="2025-10-17 09:00:00"></td></tr><tr><td><span>10:00</span></td><td data-datetime="2025-10-13 10:00:00"></td><td data-datetime="2025-10-14 10:00:00"></td><td data-datetime="2025-10-15 10:00:00"></td><td data-datetime="2025-10-16 10:00:00"></td><td data-datetime="2025-10-17 10:00:00"></td></tr><tr><td><span>11:00</span></td><td data-datetime="2025-10-13 11:00:00"></td><td data-datetime="2025-10-14 11:00:00"></td><td data-datetime="2025-10-15 11:00:00"></td><td data-datetime="2025-10-16 11:00:00"></td><td data-datetime="2025-10-17 11:00:00"></td></tr><tr><td><span>12:00</span></td><td data-datetime="2025-10-13 12:00:00"></td><td data-datetime="2025-10-14 12:00:00"></td><td data-datetime="2025-10-15 12:00:00"></td><td data-datetime="2025-10-16 12:00:00"></td><td data-datetime="2025-10-17 12:00:00"></td></tr><tr><td><span>13:00</span></td><td data-datetime="2025-10-13 13:00:00"></td><td data-datetime="2025-10-14 13:00:00"></td><td data-datetime="2025-10-15 13:00:00"></td><td data-datetime="2025-10-16 13:00:00"></td><td data-datetime="2025-10-17 13:00:00"></td></tr><tr><td><span>14:00</span></td><td data-datetime="2025-10-13 14:00:00"></td><td data-datetime="2025-10-14 14:00:00"></td><td data-datetime="2025-10-15 14:00:00"></td><td data-datetime="2025-10-16 14:00:00"></td><td data-datetime="2025-10-17 14:00:00"></td></tr><tr><td><span>15:00</span></td><td data-datetime="2025-10-13 15:00:00"></td><td data-datetime="2025-10-14 15:00:00"></td><td data-datetime="2025-10-15 15:00:00"></td><td data-datetime="2025-10-16 15:00:00"></td><td data-datetime="2025-10-17 15:00:00"></td></tr><tr><td><span>16:00</span></td><td data-datetime="2025-10-13 16:00:00"></td><td data-datetime="2025-10-14 16:00:00"></td><td data-datetime="2025-10-15 16:00:00"></td><td data-datetime="2025-10-16 16:00:00"></td><td data-datetime="2025-10-17 16:00:00"></td></tr>        </tbody>
//     </table>
// </div>
const eventRe = /<b class="title" data-eventid="\d+">([^<]+)<\/b>/g;
const timingRe = /<span  data-eventid="\d+">(\d\d:\d\d-\d\d:\d\d)<\/span>/g;
const tutorMatch = /\d+: ([0-9A-Z]{4})/; // e.g. "9: 9HAN"
const subjectMatch = /([^:]+):[^:]+:\s+(.*)/; // e.g. "Science: Yr 9: 9A/Sc2"
type timetableInfo = Week["days"];
function parseTimetable(html: string): timetableInfo {
  const days: timetableInfo = [] as any;
  const rows = html.split("</tr>");
  // first row should have the days of the week
  if (!/Monday.*Tuesday.*Wednesday.*Thursday.*Friday/.test(rows?.[0]!)) {
    return days; // bail early.
  }
  // there should be 7 cells, one for each week day and 2 wrappers.
  const cells = rows?.[1]?.split("</td>") ?? [];

  if (cells.length !== 7) {
    return days;
  }
  cells.slice(1, -1).forEach((x: string, i: number) => {
    // i is the day, x contains all periods that day.
    const periods = [...x.matchAll(eventRe)].map((y) => y[1]!);
    const timings = [...x.matchAll(timingRe)].map((y) => y[1]!);
    days[i] = periods.map((p, j) => {
      // try and match tutor or subject, failing that, dump everything in subject.
      let m = p.match(subjectMatch);
      if (m) {
        return { subject: m[1]!, group: m[2]!, timing: timings[j]! };
      }
      m = p.match(tutorMatch);
      if (m) {
        return { subject: "Tutor", group: m[1]!, timing: timings[j]! };
      }
      return { subject: p, group: "", timing: timings[j]! };
    });
  });

  return days;
}

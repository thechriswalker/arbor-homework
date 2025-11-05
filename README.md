# Arbor Homework.

Finding what homework is due on Arbor is arduous. I have to switch between kids
and I have to drill down into each homework item to find the "instructions" for
what they are supposed to do.

Not to mention that on my machines, the link to drill down to instructions appears to
be broken.

So I built this, super simple page to display current outstanding, or due homework, with the
instructions inline, with a fast toggle between kids.

Also, I extended it to have a calendar view, so we can have a timetable as well, with the same simple
child switching.

It makes a few assumptions about my kids' school so it may not work perfectly for another Arbor instance,
but the changes required should be minimal. The main assumptions are how the school formats calendar titles
and how the school has Week A/B split for the calendar.

> **This will likely be very brittle as it uses the weird interface that the website uses, but hopefully will not break much**

## todo

- more caching, for an offline mode. The data doesn't change much, we should store it locally as much
  as possible to keep things snappy

## Running it your self

This requires `bun` as a runtime (https://bun.com/) and requires you to put some config in a
config file (`.env`).

First copy the `.env.example` to `.env` and then fill in the values as described in that file.

Then, simply `bun index.ts` and it will start the server. Open a web browser to the URL printed on
start up and you will see the info.

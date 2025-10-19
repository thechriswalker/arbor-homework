# Arbor Homework.

Finding what homework is due on Arbor is arduous. I have to switch between kids
and I have to drill down into each homework item to find the "instructions" for
what they are supposed to do.

Not to mention that on my machines, the link to drill down to instructions appears to
be broken.

So I built this, super simple page to display current outstanding, or due homework, with the
instructions inline, for both kids all on one page.

## Running it your self

This requires `bun` as a runtime (https://bun.com/) and requires you to put some config in a
config file (`.env`).

First copy the `.env.example` to `.env` and then fill in the values as described in that file.

Then, simply `bun index.ts` and it will start the server. Open a web browser to the URL printed on
start up and you will see the info.

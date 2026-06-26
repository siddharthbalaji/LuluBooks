# public/books

Drop your real book assets here, then point `lib/books.ts` at them.

Expected files for the first (featured) book:

| File                  | What it is                            |
| --------------------- | ------------------------------------- |
| `featured-cover.jpg`  | The cover image shown on the desktop  |
| `featured.pdf`        | The readable / downloadable book file |

The current files are placeholders. Replace them (keep the same names, or
update the `cover` / `file` paths in `lib/books.ts`) and you're done.

To add a **new** book later, just append an object to the `books` array in
`lib/books.ts` — the desktop grid, dock, and lightbox all read from there.

# Admission form

`kedland-admission-form.pdf` goes here — the school's own form, exactly as
families fill it in at the office.

Until it is here, `DownloadBlock` (see
`src/components/sections/blocks-extra.tsx`) checks for the file at build time
and shows "Ask us for the admission form" pointing at /contact instead. Drop
the PDF in and the next build turns the download button back on; no code
change is needed.

Build package §5.2 is explicit that this is a static download — the site never
processes an admission, and there is no online admission form anywhere on it.

# MOVE DIARY initial implementation plan

Historical plan for the initial static version. For the current development project, see [maintenance.md](maintenance.md) and the root README.

Goal: the supplied v0.1 brief, published on GitHub Pages.
Architecture: dependency-free HTML/CSS/ES modules, in-memory records, local photo resizing, dedicated Canvas PNG output. No server or persistence.

- [x] Test Monday weeks, month/year boundaries, totals and optional duration.
- [x] Implement editor, accessible native dialog, eight categories, custom name, optional photo, 30-character memo, edit/delete.
- [x] Render a single 1080×1920 image template including up to seven daily records.
- [ ] Verify desktop/mobile user flow and PNG dimensions.
- [ ] Create public move-diary repository, publish root on GitHub Pages, verify live URL.

Decisions: one record per day; month label follows Thursday (majority of week), Monday start; weeks retained only in current tab memory. Images remain on device. Off-white, black, lime and lavender visual language.

Validation: five Node tests passed and local HTTP responds 200. Browser interaction and visual QA are blocked by unavailable browser policy checks; not claimed as verified. Code review found and fixed export snapshot concurrency and font fallback failures.

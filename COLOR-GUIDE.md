# Erasmus@UPT colour guide (web + app)

One palette for the web app and the mobile app, so both look like the same product.

**Source of truth:** `.impeccable/mocks/prototype/index.html` (the working prototype), which implements
`.impeccable/mocks/colors/4-charcoal.html` (Charcoal + teal). Dark theme comes from `.impeccable/mocks/colors/6-dark.html`.

**Rule:** both platforms use the token names below, never raw hex in components.
Web: CSS custom properties (`--accent`, ...). App: one theme object with the same keys.

## Light theme (default)

| Token | Hex | Use |
|---|---|---|
| `shell` | `#1f2328` | Top bar / app bar, toasts |
| `shell-ink` | `#f1f3f4` | Text on shell |
| `shell-sub` | `#b9c0c7` | Inactive nav, secondary text on shell |
| `shell-hover` | `#2d3238` | Nav hover / pressed |
| `shell-strip` | `#2a2f35` | Thin info strip under the top bar |
| `brand-mark` | `#5fc3d0` | Highlighted part of the logo, **on shell only** |
| `ground` | `#f5f5f4` | Page / screen background |
| `panel` | `#ffffff` | Cards, panes, inputs |
| `ink` | `#1b1d20` | Main text |
| `sub` | `#4a4f56` | Secondary text |
| `faint` | `#6b7178` | Hints, low-priority icons |
| `line` | `#e2e2df` | Borders, dividers, input borders |
| `chip` | `#efefed` | Neutral tags (ECTS, semester) |
| `accent` | `#0a6f7e` | Primary buttons, active nav, links, focus ring, spinner |
| `accent-hover` | `#096a78` | Primary button hover / pressed |
| `accent-ink` | `#ffffff` | Text on accent |
| `accent-soft` | `#e3f1f3` | Info notes, "from syllabus" badge background |
| `accent-soft-ink` | `#075866` | Text on `accent-soft` |
| `accent-soft-line` | `#b9dfe4` | Border of info notes |
| `selection` | `#bfe3e8` | Text selection |

Use `#0a6f7e` for the accent, not the mock's `#0b7a8a`: white text on it has more contrast (5.85 vs 5.04).

## Status

| Token | Background | Text / line | Use |
|---|---|---|---|
| `ok` | `#ddf0e4` | `#145a33` (plain `ok` = `#1d7a46`) | "Taught in English" |
| `warn` | `#fff6dc` | `#6b4d00`, border `#ecd28a` | "English unconfirmed", data notices |
| `err` | `#fbeceb` | `#b3261e` | Remove / errors |

## Faculty line colours

Each faculty has one fixed colour. The same colour means the same faculty on every screen: matches, Learning Agreement, schedule, map.

**Current scope: Automation and Computers (AC) only.** The app covers AC students and AC courses for now, so AC is the only faculty colour in use.

| Faculty | Hex |
|---|---|
| AC: Automation and Computers | `#d4631f` |

**Reserved for later** (when other faculties are added; do not reuse these hues for anything else):

| Faculty | Hex |
|---|---|
| CT: Civil Engineering | `#2b62b8` |
| MEC: Mechanical Engineering | `#2f7d47` |
| RIA: Robotics, Artificial Intelligence and Autonomous Systems | `#7a4fc9` |
| ET: Electrical and Power Engineering | `#c23b5a` |
| ARH: Architecture and Urbanism | `#8a6a08` |
| IH: *(not defined yet)* | — |

Use faculty colours for dots, left borders and timetable blocks, not small text (AC orange is only 3.75:1 on white).

## Dark theme

| Token | Hex |
|---|---|
| `shell` | `#0a1f24` |
| `shell-ink` | `#e6f2f3` |
| `ground` | `#0f1a1e` |
| `panel` | `#16252b` |
| `ink` | `#e5eef0` |
| `sub` | `#a9bcc1` |
| `line` | `#26393f` |
| `chip` | `#1d3036` |
| `accent` | `#2fa3b3` |
| `accent-ink` | `#06181c` (dark text, **not white**) |

## Rules

1. **Teal is the only action colour.** If it's teal, it is clickable or currently selected. No decorative teal.
2. **Charcoal is for the frame only:** top bar and toasts. Content sits on the light ground and white panels.
3. **No other hues** besides the status and faculty colours.
4. **Contrast:** every light-theme text pair above passes WCAG AA (4.5:1 or more).

## Open items

- **IH has no faculty colour** (only matters once faculties beyond AC are added).
- **Dark-theme buttons:** mock 6 puts white on `#2b95a5`, which fails contrast (3.53). Use `#2fa3b3` with `#06181c` text (6.07), as its active nav already does.
- **Faculty colours on dark panels:** AC orange is 4.20:1 on the dark panel, which is fine for lines and dots. The reserved CT blue (2.66) and RIA purple (2.84) fail even 3:1, so they need lighter dark-mode versions before those faculties are added.
- **Dark mock 6 is built on the teal shell, not charcoal.** If the app ships dark mode, consider a charcoal-based dark version so both themes read as one family.

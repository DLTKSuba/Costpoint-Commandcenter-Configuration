---
name: command-center-shell
description: Preserves the Costpoint Command Center shell layout, chrome, and menu interactivity (left-rail hover labels, Command Center flyout, Configure Settings second shell, inset wells, window controls, application tabs). Use when editing Command Center UI, HomeShell, LeftNavPanel, left/right rails, Configure Settings, or when the user asks to keep, restore, or match this layout.
disable-model-invocation: false
---

# Command Center shell

Canonical layout and interaction for the Command Center preview in this repo. **Do not regress** these behaviors when changing `HomeShell`, rails, or shells.

**Source of truth (code):** `src/App.tsx` (`HomeShell`), `src/index.css` (`.command-center-*`), `src/components/harmony/LeftNavPanel.tsx`, `LeftSidebar.tsx` / `LeftSidebar.css`, `RightSidebar.css`, `ShellLayout.tsx`.

Compose with existing Harmony pieces (`ShellLayout`, `Card`, `TabStrip`, `LeftSidebar`, `LeftNavPanel`). Do not rebuild the shell.

## Screen modes

| Mode | When | Main card |
|------|------|-----------|
| Dashboard | User activates any other module rail item (`blankCommandCenter === false`) | No panel header. Tab strip + Refresh. Expiration dashboard / detail tabs. |
| Command Center | User returns from the dashboard via the **Command Center** rail item, before picking a flyout item | Empty card: no panel header, no well, no checkbox. No View dropdown. No tab strip. Flyout is open. |
| Configure Settings | Initial load, and after **Configure Settings** in the flyout | First card: **Configure Settings** header + window controls and the inset well with **Enable Dela AI assistance**. Second card below it: header **Role Based Setup** + window controls. |

Leaving Command Center (click any other module in the rail) restores the dashboard and closes the settings shell.

## Chrome (presentation)

- Theme: `theme-cp`. `ShellLayout` class `command-center-shell`. Page title **Command Center**. `pageHeaderShowDefaultButtons={false}`.
- Design `Dropdown` (`.command-center-design-picker`) is `pageHeaderActions`, so it sits at the **far right of the page header** — never beside the title and never in the Role Based Setup header. Leave `.shell-page-header`'s own `justify-content: space-between` alone: that is what puts the trigger's right edge on the same line as the shell cards' right edge. The only override is `overflow: visible` so the open menu is not clipped, plus `left: auto; right: 0` on the menu so it opens inward.
- Picker contents: **Design Proposal** (`design-1`, the default and the shipping layout), then a non-selectable **Other Explorations** group header (a `disabled` option styled small-caps via `.command-center-design-picker .dropdown__item--disabled`), then **Design 2** rendered struck through with `<s>` through `optionSlots`. Superseded explorations always live under that header.
- Primary elevated `Card` class `command-center-home`. White panel headers (`background-color: #ffffff`), not table-header grey. Title left, `PanelWindowControls` right (`minus`, `window-plain`, `x-mark` via `card__icon-btn`). Controls are presentational.
- Inset well: `.command-center-shell-body` > `.command-center-shell-inner`. **No fixed height** — the well wraps its content, and the shell wraps the well (`flex: 0 0 auto` on body). Never leave empty space below the last field. Border `1px solid var(--border-color)`, `var(--radius-lg)`, white fill.
- The settings well keeps `overflow: visible` so an open `Dropdown` menu is not clipped.
- Well sits tight under the title bar: `.command-center-home .card__body:has(> .command-center-shell-body) { padding: var(--space-2); }` — do not use the default `var(--space-4)` top gap on these shells.
- Top Configure Settings well contains a functional, unchecked-by-default **Enable Dela AI assistance** Harmony `Checkbox`. Header, well, and checkbox render only while `settingsShellOpen` — entering Command Center alone leaves the first card empty.
- Settings shell: extra class `command-center-settings-shell`. It sits in `.command-center-settings-stack` (`margin-top: var(--space-5)`). Header right is window controls only.
- Design 2 footer (`.command-center-settings-actions`): Harmony `Back` (`outline`) and `Next` (`primary`) sit **below the Role Based Setup card**, not inside it. Right-aligned, `gap: var(--space-3)`, `padding-top: var(--space-4)`. Back is `disabled` on the first role (Accountant) and enabled from the second. Next advances to the next role and is `disabled` on the last role (T&E manager). Step circles stay clickable (non-linear).
- Design 1 (**Design Proposal**) is what opens by default, in the flyout handler and after leaving Command Center. It uses tabs inside the well: **Accountant**, **AI Orchestrator**, **Buyer**, **Contract Manager**, **Project Analyst**, **T&E manager**. Active tab: Harmony underline, `var(--theme-primary)`. Default tab is Accountant when the shell opens.
- Design 2 replaces the tabs with a horizontal, icon-based, non-linear `Stepper` using the same six roles. Every step is directly clickable; Accountant is initially selected.
- Design 2 has **no inset well**: the wizard and role-specific settings render directly on the settings shell inside `.command-center-settings-flat`, and the card body's own padding supplies the inset. Only Design 1 keeps `.command-center-shell-inner`. Both designs render the same interactive `.command-center-settings-panel`.
- Design 2 chrome (scoped under `.command-center-settings-wizard`; never edit shared `Step`/`Stepper` styles):
  - Current step: primary fill + `0 0 0 var(--space-1-5) var(--theme-primary-border)` halo; role icon stays.
  - Completed steps (any role before the current one): omit the icon so Harmony can render the checkmark; indicator is `var(--color-success)` with a `var(--color-success-border)` halo. Upcoming steps stay grey with their role icon.
  - Current and completed labels are `var(--text-primary)` semibold; upcoming labels are `var(--text-secondary)`.
  - Connectors always stay `var(--border-color)` (never painted as travelled).
- Selected role body (`.command-center-settings-panel`) has **no role heading or caption** — the fields start immediately. In Design 1 its inline padding is `calc(var(--space-3) + var(--space-4))` so the first field lines up with the first character of the tab labels. Settings persist while switching roles:
  - **Accountant:** default organizational rollup, reporting period source, and financial metric groups.
  - **AI Orchestrator:** default AI data scope and AI summary/recommendation/notification controls.
  - **Buyer:** procurement lifecycle stages and overdue activity date source.
  - **Contract Manager:** organizational rollup, warning/critical funding utilization thresholds, and threshold alerts.
  - **Project Analyst:** organizational rollup, review period, and project insight groups.
  - **T&E manager:** organizational rollup, overdue submission date source, and time/expense exception groups.
- Role fields are one label/value pair per row in a single shared grid (`.command-center-role-settings-form`): `grid-template-columns: max-content max-content 1fr`, labels pinned to column 1, controls to column 2, `var(--space-5)` column gap (the 20px label/value distance) and `var(--space-3)` row gap. Never lay two fields side by side. The third column is filler so full-width rows (`.command-center-role-setting-group` fieldsets, `.command-center-role-setting-block`) can span `1 / -1` across the panel.
- Rows come from `RoleSettingField`, which renders a Harmony `Label` and the control as **siblings**, both direct children of the grid. Do not wrap a field in a div and do not rely on `display: contents` to flatten Harmony's `--inline` label wrapper: Chromium does not honor it on grid items, and the pair collapses back into one cell.
- Dropdown triggers are `var(--dropdown-min-width)`; checkbox groups use fieldsets with legends; threshold percentages use Harmony `NumberInput` with the warning row directly above the critical row.
- Role content is interactive and shared between Design 1 tabs and Design 2 steps. Values persist while switching roles:
  - **Accountant:** default organizational rollup level, reporting period source, and financial metric groups (Revenue and billing, Cost and margin, Budget and EAC, Cash and receivables).
  - **AI Orchestrator:** default AI data scope and toggles for financial summaries, follow-up recommendations, and proactive notifications.
  - **Buyer:** procurement lifecycle stages (Requisition, Solicitation, Purchase order, Receipt, Invoice) and overdue activity date basis.
  - **Contract Manager:** default organizational rollup level, warning then critical funding utilization thresholds on their own rows (each clamped against the other), and threshold alert toggle.
  - **Project Analyst:** default organizational rollup level, default review period, and project insight groups.
  - **T&E manager:** default organizational rollup level, overdue submission date basis, and time/expense exception groups.
- Left rail: two floating section cards (workspace 4 icons, modules including Command Center). Keep cards; never flatten them for this flyout.
- Right rail: top-aligned to the refresh button (dashboard) or header actions (Command Center). `--cc-right-rail-top` measured in `HomeShell`. Hover: `--cc-nav-hover-bg: #A6C9EC` on inactive rail and flyout items. Active item keeps solid `--theme-primary`.

## Menu interactivity

### Left rail hover

Collapsed rail shows icons only. Hover expands and reveals labels (Harmony `.left-sidebar:hover .left-sidebar__label`). Command Center label is **Command Center** (`squares-2x2`). Inactive hover fill is `#A6C9EC`, not grey.

### Command Center click

`LeftSidebar` `onItemActivate` → `ShellLayout` `onLeftSidebarItemActivate`, which branches on `item.label === 'Command Center'`.

1. **Command Center item:** always sets `blankCommandCenter = true` and **toggles `navPanelOpen` only**. It never hides the Configure Settings screen behind it — the rail item's one job is showing or hiding the flyout, so clicking it always brings up the panel with **Configure Settings**.
2. **Any other module item:** leaves Command Center — `navPanelOpen` and `blankCommandCenter` `false`, `settingsShellOpen` `false`, settings tab back to Accountant, design back to Design Proposal. This is the only way back to the dashboard, so keep it wired.
3. While Command Center is on, that rail item is `active` (solid blue clicked state). Dashboard mode keeps **Accounting** as the default active module.

### Flyout (`LeftNavPanel`)

- Starts **closed** on page load (`blankCommandCenter` and `settingsShellOpen` start `true`, flyout stays closed). Render only when `navPanelOpen`.
- Title **Command Center**. Default item **Configure Settings**.
- Mount sets `data-rail-locked="true"` on `.shell-layout__left-sidebar`. **Never** use `data-panel-open` here — that rule strips section card background/border/shadow.
- While locked: hover width stays collapsed (`52px`; compact token under 1024px); labels stay hidden so they do not overflow under the flyout.
- Close flyout on: outside pointer (not rail, not panel), Escape, or Configure Settings click. Closing the flyout does **not** by itself leave Command Center mode.

### Configure Settings click

`onItemSelect`: `navPanelOpen = false`, `settingsShellOpen = true`, settings tab back to Accountant and design back to Design Proposal. Flyout disappears and the screen returns to the default Configure Settings page (the same one shown on load), whatever the user had changed.

## Do not

- Restore View dropdown or dashboard tab strip on the Command Center screen.
- Grey header bars on either shell.
- Grey hover on rails / flyout (`#A6C9EC` only).
- Nested `Card` in `Card`.
- Arbitrary spacing; use `var(--space-N)` (exception: the `--cc-nav-hover-bg` hex already in `index.css`).
- Fixed heights on the wells; they size to content.
- Flatten left-rail section cards when the flyout is open.

## Files to edit

| Concern | File |
|---------|------|
| State, handlers, shells, tabs | `src/App.tsx` |
| Shell / well / header / right-rail offset | `src/index.css` |
| Flyout + `data-rail-locked` | `src/components/harmony/LeftNavPanel.tsx` (+ `.css`) |
| Rail activate + hover / lock | `src/components/harmony/LeftSidebar.tsx` (+ `.css`) |
| Right-rail hover | `src/components/harmony/RightSidebar.css` |
| Prop pass-through | `src/components/harmony/ShellLayout.tsx` |

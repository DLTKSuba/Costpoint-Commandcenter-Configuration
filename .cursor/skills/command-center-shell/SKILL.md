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
| Configure Settings | Initial load, and after **Configure Command Center Settings** in the flyout | First card: **Configure Settings** header + window controls and the inset well with **Enable Dela AI assistance**. Second card below it: header **Role Based Setup** + window controls. |
| General Ledger Settings | User selects **Configure General Ledger Settings** in Accounting > General Ledger > General Ledger Controls | One card with no panel title bar: the dense Costpoint form starts at the top of the card. Nested after the Options group is the same Close Agent inset well, titled **Close Agent Settings**: **Enable Close Process Through Dela** and, when checked, **Close job** lookup. Accounting remains the active rail item. No page header and no card title bar; the title **Configure General Ledger Settings** is the first thing inside the card body. |
| Close Agent Settings | User selects **Configure Close Agent Settings** in Accounting > General Ledger > General Ledger Controls | One card with no panel title bar: the inset well starts at the top of the card. Checkbox **Enable Close Process Through Dela**; checking it reveals **Close job** (lookup only). The lookup icon opens the **Lookup** dialog. No Role Based Setup card. Accounting remains the active rail item. No page header and no card title bar; the title **Configure Close Agent Settings** is the first thing inside the card body. |

Leaving Command Center (click any other module in the rail except **Accounting**, which opens its own flyout) restores the dashboard and closes the settings shell.

## Chrome (presentation)

- Theme: `theme-cp`. `ShellLayout` class `command-center-shell`. Page title **Command Center** on every mode except the two Costpoint settings pages (`isCostpointSettingsPage`), which pass an empty `pageHeaderTitle` so `ShellLayout` skips the page header entirely and carry their own title inside the card instead: an `h2.command-center-shell-title` as the first child of `.card__body`, `--text-base` semibold on the body's own padding so it is flush with the well's left edge, with no title-bar rule and no window controls. `pageHeaderShowDefaultButtons={false}`.
- Design `Dropdown` (`.command-center-design-picker`) is `pageHeaderActions`, so it sits at the **far right of the page header** — never beside the title and never in the Role Based Setup header. Leave `.shell-page-header`'s own `justify-content: space-between` alone: that is what puts the trigger's right edge on the same line as the shell cards' right edge. The only override is `overflow: visible` so the open menu is not clipped, plus `left: auto; right: 0` on the menu so it opens inward.
- Picker contents: **Design Proposal** (`design-1`, the default and the shipping layout), then a non-selectable **Other Explorations** group header (a `disabled` option styled small-caps via `.command-center-design-picker .dropdown__item--disabled`), then **Design 2** rendered struck through with `<s>` through `optionSlots`. Superseded explorations always live under that header.
- Primary elevated `Card` class `command-center-home`. White panel headers (`background-color: #ffffff`), not table-header grey. Title left, `PanelWindowControls` right (`minus`, `window-plain`, `x-mark` via `card__icon-btn`). Controls are presentational.
- Inset well: `.command-center-shell-body` > `.command-center-shell-inner`. **No fixed height** — the well wraps its content, and the shell wraps the well (`flex: 0 0 auto` on body). Never leave empty space below the last field. Border `1px solid var(--border-color)`, `var(--radius-lg)`, white fill.
- The settings well keeps `overflow: visible` so an open `Dropdown` menu is not clipped.
- Well sits tight under the title bar: `.command-center-home .card__body:has(> .command-center-shell-body) { padding: var(--space-2); }` — do not use the default `var(--space-4)` top gap on these shells.
- Top Configure Settings well contains a functional, unchecked-by-default **Enable Dela AI assistance** Harmony `Checkbox`. Header, well, and checkbox render only while `settingsShellOpen` — entering Command Center alone leaves the first card empty. **Close Agent Settings** uses the same well with **Enable Close Process Through Dela**; when that box is checked, a **Close job** row appears (label and a lookup `Input` with a magnifying-glass trailing button). The row is indented by the checkbox box plus its gap so **Close job** starts under the first character of the checkbox label. **Role Based Setup is not shown** on the Close Agent page.
- General Ledger Settings form (`.general-ledger-settings`, `GeneralLedgerSettingsPanel`): group boxes whose blue heading is a legend astride the box's own top border (`h3` absolute, `translateY(-50%)`, `--surface-bg` fill breaking the border line). On this page the Dela well (`.general-ledger-settings__dela-well`) is titled **Close Agent Settings** and takes the same legend treatment, except its fill is `#ffffff` to match the well's own white body rather than `--surface-bg`; the standalone Close Agent page has no such legend since its card title already says it. Order is full-width **Company/Name**, full-width **Options**, the Dela well, full-width **Retained Earnings Info**, full-width **Update G/L Beginning Balances Defaults**, then `.general-ledger-settings__matrix` — a two-column grid (`1.2fr 1fr`) whose sections are direct grid items so each row pairs left with right exactly as Costpoint does: **Functional Currency / Intercompany Receivables Posting Subperiod**, **Other Comprehensive Income Info / Print Journal For**, **Data Entry Headings / Balance Sheet Revaluation Options**. The **Corporate Settings / Approval Settings / Batch Job Email Notification** subtask row plus overflow dot button (`.general-ledger-settings__tabs`, `GeneralLedgerSettingsTabs`) is not part of the form: Costpoint draws it outside the frame, so it renders as a sibling after `.command-center-shell-inner` and sits below that well's bottom border. Values are sized per data tier (code fields, `--code` short codes, `--wide-value` FS lines), required labels use the Harmony `Label required` red asterisk, and read-only values (Company, currency name) take `--input-disabled-bg`.
- Close job lookup (`.close-job-lookup`, `CLOSE_JOB_LOOKUP_ROWS`): the magnifying glass opens a Harmony `Dialog` titled **Lookup** — header carries a **Query** `Dropdown` plus minimize/maximize (`PanelWindowControls showClose={false}`, since `Dialog` supplies its own close), body is a striped `Table` of close jobs (Job ID, Description, Job Group, On Application Failure Option, Default Priority, Comments, Creator), footer is right-aligned **Select** (`primary`) / **Cancel** (`outline`), both `size="sm"`. Clicking a row immediately fills the Close job field and marks the row `table-row--selected`; **Select** keeps it, **Cancel** and the header close button restore the value the field held when the dialog opened.
- Lookup chrome matches the Costpoint Lookup window and is verified against the reference screenshot: `var(--space-1)` `--theme-primary` top edge, `--radius-sm` corners, `--elevated-bg` header and footer bands, `--surface-bg` body, `--dialog-max-width-medium` width, `resizable={false}` (no grip). The grid is dense: `--text-xs` at `--leading-tight`, `table-layout: fixed` with percentage column widths so the two long headers wrap to two lines and long Comments truncate with an ellipsis, centered semibold headers on `--table-header-gray-bg`, `--border-color` dividers on every cell, square corners, and a selected row that keeps the `--table-row-selected-bg` tint inside a `--theme-primary` outline. Selectors are written as `.close-job-lookup .close-job-lookup__table …` so they outrank the base `.table` rules that round corners and strip column dividers.
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

1. **Command Center item:** always sets `blankCommandCenter = true` and **toggles the Command Center flyout** (`navPanelId === 'command-center'`). It never hides the Configure Settings screen behind it — the rail item's one job is showing or hiding the flyout, so clicking it always brings up the panel with **Configure Command Center Settings**.
2. **Accounting item:** **toggles the Accounting flyout** (`navPanelId === 'accounting'`) and opens the page of whichever settings item the flyout has selected, since the flyout never opens without a selection: `blankCommandCenter` and `settingsShellOpen` go `true` and `settingsPage` becomes `'general-ledger'` unless it is already `'close-agent'`. The dashboard is never what shows behind this flyout. The panel is titled **Accounting** and uses the nested Costpoint tree (General Ledger expanded through General Ledger Controls, then **Configure General Ledger Settings** / **Configure Close Agent Settings**). **Configure General Ledger Settings** is display-only (`interactive: false`): it can be starred when that page is showing, but it is not a button and never navigates. Selecting **Configure Close Agent Settings** closes the flyout and opens that page. Plus/minus expanders, pale-blue expanded rows, tree guides, and `#A6C9EC` hover stay on `LeftNavPanel`.
3. **Any other module item:** leaves Command Center — `navPanelId` `null`, `blankCommandCenter` `false`, `settingsShellOpen` `false`, settings tab back to Accountant, design back to Design Proposal.
4. While Command Center is on, that rail item is `active` (solid blue clicked state). Dashboard / Accounting mode keeps **Accounting** as the default active module.

### Flyout (`LeftNavPanel`)

- Starts **closed** on page load (`blankCommandCenter` and `settingsShellOpen` start `true`, flyout stays closed). Render only when `navPanelId` is set.
- Title **Command Center**. Default item **Configure Command Center Settings**.
- Accounting flyout: title **Accounting**; items from `ACCOUNTING_NAV_ITEMS`; default expanded **General Ledger** and **General Ledger Controls**. Its selected item is derived from `settingsPage` (**Configure Close Agent Settings** on the close-agent page, otherwise **Configure General Ledger Settings**), never hardcoded — the starred item must always name the page on screen. **Configure General Ledger Settings** is not clickable.
- Mount sets `data-rail-locked="true"` on `.shell-layout__left-sidebar`. **Never** use `data-panel-open` here — that rule strips section card background/border/shadow.
- While locked: hover width stays collapsed (`52px`; compact token under 1024px); labels stay hidden so they do not overflow under the flyout.
- Close flyout on: outside pointer (not rail, not panel), Escape, or **Configure Command Center Settings** click. Closing the flyout does **not** by itself leave Command Center mode.

### Configure Command Center Settings click

`onItemSelect`: `navPanelId = null`, `settingsShellOpen = true`, settings tab back to Accountant and design back to Design Proposal. Flyout disappears and the screen returns to the default Configure Settings page (the same one shown on load), whatever the user had changed.

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

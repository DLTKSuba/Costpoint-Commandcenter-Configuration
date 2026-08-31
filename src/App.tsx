import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Routes, Route } from 'react-router-dom'
import { ShellLayout } from './components/harmony/ShellLayout'
import type { ShellLayoutProps } from './components/harmony/ShellLayout'
import type {
  LeftSidebarItemActivateDetail,
  LeftSidebarSection,
} from './components/harmony/LeftSidebar'
import { Card } from './components/harmony/Card'
import { Button } from './components/harmony/Button'
import { Checkbox } from './components/harmony/Checkbox'
import { Dialog } from './components/harmony/Dialog'
import { Dropdown } from './components/harmony/Dropdown'
import { InteractionRulesPanel } from './components/harmony/InteractionRulesPanel'
import { Label } from './components/harmony/Label'
import { LeftNavPanel } from './components/harmony/LeftNavPanel'
import { NumberInput } from './components/harmony/NumberInput'
import { Stepper } from './components/harmony/Stepper'
import { TabStrip, type TabStripTab } from './components/harmony/TabStrip'
import { Table } from './components/harmony/Table'
import {
  ContractsExpirationDashboard,
  type ExpirationTierKey,
  type ExpiryTierContract,
  type FundingUtilizationSummary,
  type HighFundingLine,
  type TierExpiryLine,
  type VizDesignOption,
  type DailyChartIteration,
} from './components/harmony/ContractsExpirationDashboard'
import { Link } from './components/harmony/Link'
import { Icon } from './components/harmony/Icon'
import { Input } from './components/harmony/Input'
import { Textarea } from './components/harmony/Textarea'
import { ComponentGalleryPage } from './pages/ComponentGalleryPage'
import { ComponentDemoPage } from './pages/ComponentDemoPage'
import { RightSidebarPanelDemosPage } from './pages/RightSidebarPanelDemosPage'

/** Default product theme for the designer preview (change via document.documentElement.classList if needed). */
const DEFAULT_THEME = 'theme-cp'

/**
 * Per-theme ShellLayout prop defaults.
 * When DEFAULT_THEME changes, HomeShell automatically picks up the correct
 * footer visibility, floating nav, sidebar variant, product name, and logo.
 */
const THEME_SHELL_PROPS: Record<string, Partial<ShellLayoutProps>> = {
  'theme-cp': {
    productName: 'CP',
    logoSrc: '/logos/CostpointLogo.png',
    logoWordmark: true,
    showFooter: false,
    showFloatingNav: true,
    leftSidebarVariant: 'cp',
    rightSidebarVariant: 'cp',
  },
  'theme-vp': {
    productName: 'VP',
    logoSrc: '/logos/CPVPLogo.svg',
    showFooter: true,
    leftSidebarVariant: 'vp',
    rightSidebarVariant: 'vp',
  },
  'theme-ppm': {
    productName: 'PPM',
    logoSrc: '/logos/PPMLogo.svg',
    showFooter: true,
    leftSidebarVariant: 'ppm',
    rightSidebarVariant: 'ppm',
  },
  'theme-maconomy': {
    productName: 'Maconomy',
    logoSrc: '/logos/MacLogo.svg',
    showFooter: true,
    leftSidebarVariant: 'maconomy',
    rightSidebarVariant: 'maconomy',
  },
}

/** Rail item whose label opens the Command Center flyout. */
const COMMAND_CENTER_NAV_LABEL = 'Command Center'

/** Costpoint application tabs inside the Configure Settings well. */
const SETTINGS_SHELL_TABS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'accountant', label: 'Accountant' },
  { id: 'ai-orchestrator', label: 'AI Orchestrator' },
  { id: 'buyer', label: 'Buyer' },
  { id: 'contract-manager', label: 'Contract Manager' },
  { id: 'project-analyst', label: 'Project Analyst' },
  { id: 'te-manager', label: 'T&E manager' },
]

/**
 * Design Proposal is the shipping layout. Superseded explorations sit under a
 * non-selectable group header and read as struck through.
 */
const SETTINGS_DESIGN_OPTIONS = [
  { value: 'design-1', label: 'Design Proposal' },
  { value: 'other-explorations', label: 'Other Explorations', disabled: true },
  { value: 'design-2', label: 'Design 2' },
]

const SETTINGS_DESIGN_OPTION_SLOTS = [
  null,
  <span className="command-center-design-picker__group-label">Other Explorations</span>,
  <s>Design 2</s>,
]

/**
 * Design 2 role wizard. Icons stay on the current and upcoming steps. Completed
 * steps drop the icon so Harmony can render the checkmark.
 */
const SETTINGS_WIZARD_STEPS = [
  { label: 'Accountant', icon: 'calculator' },
  { label: 'AI Orchestrator', icon: 'command-line' },
  { label: 'Buyer', icon: 'cube' },
  { label: 'Contract Manager', icon: 'clipboard-document-list' },
  { label: 'Project Analyst', icon: 'chart-bar' },
  { label: 'T&E manager', icon: 'clock' },
]

/** Organization depth an admin can scope the selected application to. */
const ORG_LEVEL_OPTIONS = [
  { value: 'level-1', label: 'Level 1' },
  { value: 'level-2', label: 'Level 2' },
  { value: 'level-3', label: 'Level 3' },
  { value: 'level-4', label: 'Level 4' },
]

const REPORTING_PERIOD_OPTIONS = [
  { value: 'current-accounting-period', label: 'Current accounting period' },
  { value: 'latest-closed-period', label: 'Latest closed period' },
  { value: 'current-fiscal-period', label: 'Current fiscal period' },
  { value: 'user-selected-period', label: 'Allow user selection' },
]

const OVERDUE_DATE_OPTIONS = [
  { value: 'required-date', label: 'Required date' },
  { value: 'promised-date', label: 'Vendor promised date' },
  { value: 'po-delivery-date', label: 'Purchase order delivery date' },
]

const AI_SCOPE_OPTIONS = [
  { value: 'role-data', label: 'Current role data only' },
  { value: 'command-center', label: 'All Command Center data' },
  { value: 'organization', label: 'Selected organization and children' },
]

const PROJECT_PERIOD_OPTIONS = [
  { value: 'period-to-date', label: 'Period to date' },
  { value: 'year-to-date', label: 'Year to date' },
  { value: 'project-lifecycle', label: 'Project lifecycle' },
]

const TIME_EXCEPTION_OPTIONS = [
  { value: 'period-end', label: 'Period end date' },
  { value: 'timesheet-due', label: 'Timesheet due date' },
  { value: 'supervisor-review', label: 'Supervisor review date' },
]

const DEFAULT_ROLE_SETTINGS: Record<string, string | number | boolean> = {
  accountantPeriodSource: 'current-accounting-period',
  accountantRevenueMetrics: true,
  accountantCostMetrics: true,
  accountantBudgetMetrics: true,
  accountantCashMetrics: false,
  aiSummaries: true,
  aiRecommendations: true,
  aiNotifications: false,
  aiScope: 'role-data',
  buyerRequisition: true,
  buyerSolicitation: true,
  buyerPurchaseOrder: true,
  buyerReceipt: true,
  buyerInvoice: false,
  buyerOverdueDate: 'required-date',
  contractWarningThreshold: 75,
  contractCriticalThreshold: 90,
  contractAlerts: true,
  projectPeriod: 'period-to-date',
  projectBudgetMetrics: true,
  projectScheduleMetrics: true,
  projectRiskMetrics: true,
  teExceptionDate: 'timesheet-due',
  teMissingTimesheets: true,
  tePendingApprovals: true,
  teExpenseExceptions: true,
}

/**
 * Minimize / maximize / close trio that Costpoint panel headers carry on the
 * right. Presentational for now — the shells are not yet resizable.
 */
function PanelWindowControls() {
  return (
    <>
      <button className="card__icon-btn" type="button" aria-label="Minimize">
        <Icon name="minus" size="sm" />
      </button>
      <button className="card__icon-btn" type="button" aria-label="Maximize">
        <Icon name="window-plain" size="sm" />
      </button>
      <button className="card__icon-btn" type="button" aria-label="Close">
        <Icon name="x-mark" size="sm" />
      </button>
    </>
  )
}

/**
 * Role setting row: label and control are siblings so they land in the role
 * form's own grid columns, which keeps every label and every value aligned.
 */
function RoleSettingField({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) {
  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <div className="command-center-role-setting-control">{children}</div>
    </>
  )
}

/**
 * Left rail grouped into two floating cards: a workspace group (home, apps,
 * favourites, recent) above the module group, matching the Costpoint nav.
 */
const COMMAND_CENTER_SIDEBAR_SECTIONS: LeftSidebarSection[] = [
  {
    items: [
      { icon: 'home', label: 'Home' },
      { icon: 'squares-plus', label: 'Applications' },
      { icon: 'star', label: 'Favorites' },
      { icon: 'queue-list', label: 'Recently Viewed' },
    ],
  },
  {
    items: [
      { icon: 'magnifying-glass', label: 'Search' },
      { icon: 'squares-2x2', label: COMMAND_CENTER_NAV_LABEL },
      { icon: 'clipboard-document-list', label: 'Accounting', active: true },
      { icon: 'cube', label: 'Materials' },
      { icon: 'users', label: 'People' },
      { icon: 'clock', label: 'Time' },
      { icon: 'document-chart-bar', label: 'Reports' },
      { icon: 'cog-6-tooth', label: 'Settings' },
    ],
  },
]

const REQ_MAIN_TAB_IDS = ['requisitions'] as const

const PO_DETAIL_TAB_PREFIX = 'po-detail:' as const

function poDetailTabId(poId: string) {
  return `${PO_DETAIL_TAB_PREFIX}${poId}`
}

function isPoDetailTabId(id: string) {
  return id.startsWith(PO_DETAIL_TAB_PREFIX)
}

function poIdFromDetailTabId(id: string): string | null {
  if (!isPoDetailTabId(id)) return null
  return id.slice(PO_DETAIL_TAB_PREFIX.length)
}

const PR_DETAIL_TAB_PREFIX = 'pr-detail:' as const

function prDetailTabId(prId: string) {
  return `${PR_DETAIL_TAB_PREFIX}${prId}`
}

function isPrDetailTabId(id: string) {
  return id.startsWith(PR_DETAIL_TAB_PREFIX)
}

function prIdFromDetailTabId(id: string): string | null {
  if (!isPrDetailTabId(id)) return null
  return id.slice(PR_DETAIL_TAB_PREFIX.length)
}

/** Per-project line items when a contract row is expanded (grid columns mirror the parent row). */
type ContractProjectLine = {
  id: string
  name: string
  nextImportantDate: string
  startDate: string
  endDate: string
  contractValue: string
  fundedValue: string
  itdRevenue: string
  itdCost: string
  fundingPercent: number
}

type RequisitionRow = {
  id: string
  /** Contract reference in Contract Info column (e.g. 0624SE-CNTR0001). */
  contractNumber: string
  /** Contract Details summary — mirrors Command Center contract metadata. */
  contractType: string
  taskOrderNo: string
  projectType: string
  contractVehicle: string
  primeContractNo: string
  managerName: string
  /** Display string for Contract End (e.g. Jan 15, 2027). */
  contractEnd: string
  vendorId: string
  vendor: string
  amount: string
  /** Next milestone / review date (Command Center grid). */
  nextImportantDate: string
  /** Contract effective start. */
  startDate: string
  /** Funded (commitment) value. */
  fundedValue: string
  /** Incurred to date revenue. */
  itdRevenue: string
  /** Incurred to date cost. */
  itdCost: string
  /** Funding used — ITD as % of funded (0–100+). */
  fundingPercent: number
  statusLabel: string
  stageIndices: readonly number[]
  overdue: string
  overdueUrgent?: boolean
  requestedBy: string
  organization: string
  createdDate: string
  needBy: string
  /** Optional copy for the yellow stat strip above Summary (empty hides the line). */
  bannerMessage: string
  /** Lines assigned to the logged-in buyer (Summary). */
  buyerAssignedLineCount: number
  /** Late lines per lifecycle stage for Late Items panel (indices match REQ_STATUS_STAGE_LABELS). */
  lateItemsStageCounts: readonly [number, number, number, number]
  requisitionerName: string
  requisitionerEmail: string
  /** Days until contract end (Command Center expiry tiers & filters). */
  daysUntilContractExpiry: number
  /** Project lines shown when the contract row is expanded. */
  projects: readonly ContractProjectLine[]
}

type RequisitionLineRow = {
  line: string
  status: string
  projectId: string
  projectName: string
  item: string
  rev: string
  itemDesc: string
  lnStatus: string
  preferredVendor: string
  targetPlaceDate: string
  daysUntilTarget: number
  nextApprover: string
  qty: string
  unitCost: string
  lineTotalCost: string
  accountId: string
  accountName: string
  orgId: string
  orgName: string
}

/** Demo “today”: May 6, 2026 — aligns contract ends and expiry KPIs with `daysUntilContractExpiry`. (`Date` month is 0-based; `4` = May.) */
const COMMAND_CENTER_AS_OF = new Date(2026, 4, 6)

function formatDateMdY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  return `${mm}/${dd}/${yyyy}`
}

/** Table display: prefer mm/dd/yyyy for any parseable date string. */
function formatTableDate(value: string): string {
  const t = Date.parse(value)
  if (!Number.isFinite(t)) return value
  return formatDateMdY(new Date(t))
}

function formatContractEndFromDays(daysFromAsOf: number): string {
  const d = new Date(COMMAND_CENTER_AS_OF)
  d.setDate(d.getDate() + daysFromAsOf)
  return formatDateMdY(d)
}

function makeDemoRow(spec: {
  id: string
  /** 1-based sequence used to build Costpoint-style contract and project IDs. */
  contractSeq: number
  vendor: string
  vendorId: string
  daysUntil: number
  fundingPercent: number
  statusLabel: string
  managerName: string
  amount?: string
}): RequisitionRow {
  const contractEnd = formatContractEndFromDays(spec.daysUntil)
  const amount = spec.amount ?? '$12,000.00'
  const contractNumber = `0624SE-CNTR${String(spec.contractSeq).padStart(4, '0')}`
  const projectRoot = String(spec.contractSeq).padStart(4, '0')
  return {
    id: spec.id,
    contractNumber,
    contractType: 'Firm Fixed Price',
    taskOrderNo: `TO-${String(spec.contractSeq).padStart(3, '0')}`,
    projectType: 'Operations',
    contractVehicle: 'IDIQ',
    primeContractNo: 'PRIME-2024-0112',
    managerName: spec.managerName,
    contractEnd,
    vendorId: spec.vendorId,
    vendor: spec.vendor,
    amount,
    nextImportantDate: '04/12/2025',
    startDate: '04/02/2025',
    fundedValue: amount,
    itdRevenue: '$4,800.00',
    itdCost: '$3,900.00',
    fundingPercent: spec.fundingPercent,
    statusLabel: spec.statusLabel,
    stageIndices: [0, 2],
    overdue: '1/3',
    overdueUrgent: spec.fundingPercent >= 80,
    requestedBy: spec.managerName,
    organization: 'HQ — Procurement',
    createdDate: '04/02/2025',
    needBy: contractEnd,
    bannerMessage: '',
    buyerAssignedLineCount: 2,
    lateItemsStageCounts: [1, 0, 0, 0],
    requisitionerName: spec.managerName,
    requisitionerEmail: `${spec.managerName.toLowerCase().replace(/\s+/g, '.')}@contoso.com`,
    projects: [
      {
        id: `${projectRoot}.001.01`,
        name:
          spec.daysUntil % 2 === 0 ? 'HQ Facilities Refresh' : 'Field Services Expansion',
        nextImportantDate: '',
        startDate: '04/02/2025',
        endDate: contractEnd,
        contractValue: amount,
        fundedValue: amount,
        itdRevenue: '$4,800.00',
        itdCost: '$3,900.00',
        fundingPercent: spec.fundingPercent,
      },
      {
        id: `${projectRoot}.001.02`,
        name:
          spec.daysUntil % 2 === 0 ? 'Campus Systems Upgrade' : 'Regional Ops Support',
        nextImportantDate: '',
        startDate: '04/02/2025',
        endDate: contractEnd,
        contractValue: amount,
        fundedValue: amount,
        itdRevenue: '$2,400.00',
        itdCost: '$1,950.00',
        fundingPercent: Math.max(20, spec.fundingPercent - 8),
      },
    ],
    daysUntilContractExpiry: spec.daysUntil,
  }
}

/**
 * Demo roster sized for visualization options:
 * — 0–30 days: 6 (including 2 on May 9 / day 3, 3 on May 18 / day 12)
 * — 31–60 days: 4
 * — 61–90 days: 8
 */
const REQUISITION_ROWS: RequisitionRow[] = [
  // 0–30 days (6): May 9 ×2, May 18 ×3, plus May 14
  makeDemoRow({
    id: 'PR-2101',
    contractSeq: 1,
    vendor: 'Summit Field Services',
    vendorId: 'VND-901101',
    daysUntil: 3,
    fundingPercent: 71,
    statusLabel: 'Pending Approval',
    managerName: 'Alex Rivera',
    amount: '$8,200.00',
  }),
  makeDemoRow({
    id: 'PR-2102',
    contractSeq: 2,
    vendor: 'Harbor Labs West',
    vendorId: 'VND-901102',
    daysUntil: 3,
    fundingPercent: 55,
    statusLabel: 'Pending Approval',
    managerName: 'Jamie Chen',
    amount: '$11,400.00',
  }),
  makeDemoRow({
    id: 'PR-2047',
    contractSeq: 3,
    vendor: 'Armstrong Labs',
    vendorId: 'VND-900807',
    daysUntil: 8,
    fundingPercent: 92,
    statusLabel: 'Rejected',
    managerName: 'Sarah Johnson',
    amount: '$42,000.00',
  }),
  makeDemoRow({
    id: 'PR-2045',
    contractSeq: 4,
    vendor: 'Litware Medical Devices',
    vendorId: 'VND-900205',
    daysUntil: 12,
    fundingPercent: 64,
    statusLabel: 'Pending Approval',
    managerName: 'Sam Lee',
    amount: '$15,000.00',
  }),
  makeDemoRow({
    id: 'PR-2048',
    contractSeq: 5,
    vendor: 'Wide World Importers',
    vendorId: 'VND-900448',
    daysUntil: 12,
    fundingPercent: 82,
    statusLabel: 'Pending PO Creation',
    managerName: 'Priya Nair',
    amount: '$58,000.00',
  }),
  makeDemoRow({
    id: 'PR-2103',
    contractSeq: 6,
    vendor: 'Cascade Components',
    vendorId: 'VND-901103',
    daysUntil: 12,
    fundingPercent: 48,
    statusLabel: 'Pending Submittal',
    managerName: 'Morgan Chen',
    amount: '$9,750.00',
  }),

  // 31–60 days (4)
  makeDemoRow({
    id: 'PR-2201',
    contractSeq: 7,
    vendor: 'Beacon Industrial',
    vendorId: 'VND-902201',
    daysUntil: 35,
    fundingPercent: 66,
    statusLabel: 'Pending Approval',
    managerName: 'Taylor Kim',
    amount: '$14,200.00',
  }),
  makeDemoRow({
    id: 'PR-2202',
    contractSeq: 8,
    vendor: 'Riverbank Supply Co.',
    vendorId: 'VND-902202',
    daysUntil: 42,
    fundingPercent: 39,
    statusLabel: 'Pending Submittal',
    managerName: 'Casey Brooks',
    amount: '$7,800.00',
  }),
  makeDemoRow({
    id: 'PR-2041',
    contractSeq: 9,
    vendor: 'Acme Office Supplies',
    vendorId: 'VND-900101',
    daysUntil: 48,
    fundingPercent: 38,
    statusLabel: 'Pending Approval',
    managerName: 'Alex Rivera',
    amount: '$6,500.00',
  }),
  makeDemoRow({
    id: 'PR-2203',
    contractSeq: 10,
    vendor: 'Pinecrest Logistics',
    vendorId: 'VND-902203',
    daysUntil: 55,
    fundingPercent: 74,
    statusLabel: 'Pending PO Creation',
    managerName: 'Jordan Smith',
    amount: '$21,000.00',
  }),

  // 61–90 days (8)
  makeDemoRow({
    id: 'PR-2301',
    contractSeq: 11,
    vendor: 'Northshore MRO',
    vendorId: 'VND-903301',
    daysUntil: 62,
    fundingPercent: 52,
    statusLabel: 'Pending Approval',
    managerName: 'Riley Ortiz',
    amount: '$5,900.00',
  }),
  makeDemoRow({
    id: 'PR-2043',
    contractSeq: 12,
    vendor: 'Contoso Training Group',
    vendorId: 'VND-900503',
    daysUntil: 68,
    fundingPercent: 45,
    statusLabel: 'Pending Submittal',
    managerName: 'Morgan Chen',
    amount: '$10,500.00',
  }),
  makeDemoRow({
    id: 'PR-2042',
    contractSeq: 13,
    vendor: 'Northwind Logistics LLC',
    vendorId: 'VND-900302',
    daysUntil: 72,
    fundingPercent: 88,
    statusLabel: 'Pending PO Creation',
    managerName: 'Jordan Smith',
    amount: '$32,000.00',
  }),
  makeDemoRow({
    id: 'PR-2046',
    contractSeq: 14,
    vendor: 'Adventure Works IT',
    vendorId: 'VND-900606',
    daysUntil: 75,
    fundingPercent: 28,
    statusLabel: 'Pending Submittal',
    managerName: 'Casey Brooks',
    amount: '$4,500.00',
  }),
  makeDemoRow({
    id: 'PR-2302',
    contractSeq: 15,
    vendor: 'Blue Ridge Fabrication',
    vendorId: 'VND-903302',
    daysUntil: 78,
    fundingPercent: 61,
    statusLabel: 'Pending Approval',
    managerName: 'Sam Lee',
    amount: '$18,600.00',
  }),
  makeDemoRow({
    id: 'PR-2303',
    contractSeq: 16,
    vendor: 'Elm Street Electrical',
    vendorId: 'VND-903303',
    daysUntil: 82,
    fundingPercent: 69,
    statusLabel: 'Pending PO Creation',
    managerName: 'Priya Nair',
    amount: '$13,250.00',
  }),
  makeDemoRow({
    id: 'PR-2044',
    contractSeq: 17,
    vendor: 'Fabrikam Facilities Inc.',
    vendorId: 'VND-900704',
    daysUntil: 85,
    fundingPercent: 62,
    statusLabel: 'Rejected',
    managerName: 'Riley Ortiz',
    amount: '$5,500.00',
  }),
  makeDemoRow({
    id: 'PR-2304',
    contractSeq: 18,
    vendor: 'Oakline Security',
    vendorId: 'VND-903304',
    daysUntil: 88,
    fundingPercent: 33,
    statusLabel: 'Pending Submittal',
    managerName: 'Taylor Kim',
    amount: '$16,800.00',
  }),
]

const DEFAULT_EXPIRY_MAX_DAYS = 90

type ExpiryTierKey = 'critical' | 'warning' | 'upcoming'

function matchesExpiryTier(row: RequisitionRow, tier: ExpiryTierKey): boolean {
  const d = row.daysUntilContractExpiry
  if (tier === 'critical') return d <= 30
  if (tier === 'warning') return d >= 31 && d <= 60
  return d >= 61 && d <= 90
}

function matchesHighFunding(row: RequisitionRow): boolean {
  return row.fundingPercent >= 65
}

type FundingBucketKey = 'fundLow' | 'fundMid' | 'fundHigh'

function matchesFundingBucket(row: RequisitionRow, bucket: FundingBucketKey): boolean {
  const p = row.fundingPercent
  if (bucket === 'fundLow') return p <= 59
  if (bucket === 'fundMid') return p >= 60 && p <= 75
  return p >= 76
}

function parseDisplayDate(value: string): number {
  const t = Date.parse(value)
  return Number.isFinite(t) ? t : 0
}

function filterRowsByKpiSelection(
  rows: RequisitionRow[],
  selectedTier: ExpirationTierKey | null,
): RequisitionRow[] {
  const withinDefault = rows.filter((r) => r.daysUntilContractExpiry <= DEFAULT_EXPIRY_MAX_DAYS)
  if (selectedTier == null) return withinDefault
  if (selectedTier === 'highFunding') return withinDefault.filter((r) => matchesHighFunding(r))
  if (selectedTier === 'fundLow' || selectedTier === 'fundMid' || selectedTier === 'fundHigh') {
    return withinDefault.filter((r) => matchesFundingBucket(r, selectedTier))
  }
  // Expiry tiers include every contract in the window, regardless of funding used.
  return withinDefault.filter((r) => matchesExpiryTier(r, selectedTier))
}

function summarizeFundingUtilization(rows: RequisitionRow[]): FundingUtilizationSummary {
  const base = rows.filter((r) => r.daysUntilContractExpiry <= DEFAULT_EXPIRY_MAX_DAYS)
  const above = base.filter((r) => r.fundingPercent >= 65)
  return {
    aboveThresholdCount: above.length,
    totalInWindow: base.length,
    tiers: {
      critical: above.filter((r) => r.fundingPercent >= 90).length,
      elevated: above.filter((r) => r.fundingPercent >= 80 && r.fundingPercent < 90).length,
      normal: above.filter((r) => r.fundingPercent >= 65 && r.fundingPercent < 80).length,
    },
    belowThresholdCount: base.filter((r) => r.fundingPercent < 65).length,
    buckets: {
      low: base.filter((r) => r.fundingPercent <= 59).length,
      mid: base.filter((r) => r.fundingPercent >= 60 && r.fundingPercent <= 75).length,
      high: base.filter((r) => r.fundingPercent >= 76).length,
    },
  }
}

function summarizeExpirationTierCounts(rows: RequisitionRow[]): {
  critical: number
  warning: number
  upcoming: number
} {
  const base = rows.filter((r) => r.daysUntilContractExpiry <= DEFAULT_EXPIRY_MAX_DAYS)
  return {
    critical: base.filter((r) => r.daysUntilContractExpiry <= 30).length,
    warning: base.filter((r) => r.daysUntilContractExpiry >= 31 && r.daysUntilContractExpiry <= 60).length,
    upcoming: base.filter((r) => r.daysUntilContractExpiry >= 61 && r.daysUntilContractExpiry <= 90).length,
  }
}

function summarizeExpirationTierContracts(rows: RequisitionRow[]): {
  critical: ExpiryTierContract[]
  warning: ExpiryTierContract[]
  upcoming: ExpiryTierContract[]
} {
  const base = rows.filter((r) => r.daysUntilContractExpiry <= DEFAULT_EXPIRY_MAX_DAYS)
  const toContract = (row: RequisitionRow): ExpiryTierContract => ({
    name: row.vendor,
    expirationDate: row.contractEnd,
    daysRemaining: row.daysUntilContractExpiry,
  })
  const sortByExpiry = (tierRows: RequisitionRow[]) =>
    [...tierRows].sort((a, b) => a.daysUntilContractExpiry - b.daysUntilContractExpiry).map(toContract)

  return {
    critical: sortByExpiry(base.filter((r) => matchesExpiryTier(r, 'critical'))),
    warning: sortByExpiry(base.filter((r) => matchesExpiryTier(r, 'warning'))),
    upcoming: sortByExpiry(base.filter((r) => matchesExpiryTier(r, 'upcoming'))),
  }
}

function summarizeExpirationTierFirstExpiry(rows: RequisitionRow[]): {
  critical: TierExpiryLine
  warning: TierExpiryLine
  upcoming: TierExpiryLine
} {
  const tiers = ['critical', 'warning', 'upcoming'] as const satisfies readonly ExpiryTierKey[]
  const base = rows.filter((r) => r.daysUntilContractExpiry <= DEFAULT_EXPIRY_MAX_DAYS)
  const result: {
    critical: TierExpiryLine
    warning: TierExpiryLine
    upcoming: TierExpiryLine
  } = {
    critical: null,
    warning: null,
    upcoming: null,
  }
  for (const tier of tiers) {
    const inTier = base.filter((r) => matchesExpiryTier(r, tier))
    if (inTier.length === 0) continue
    const row = inTier.reduce((a, b) =>
      a.daysUntilContractExpiry <= b.daysUntilContractExpiry ? a : b,
    )
    const d = row.daysUntilContractExpiry
    result[tier] = {
      firstExpiresDate: formatContractEndFromDays(d),
      daysUntilShort: `${d}d`,
    }
  }
  return result
}

function summarizeHighFunding(rows: RequisitionRow[]): {
  count: number
  line: HighFundingLine
} {
  const base = rows.filter(
    (r) => r.daysUntilContractExpiry <= DEFAULT_EXPIRY_MAX_DAYS && matchesHighFunding(r),
  )
  if (base.length === 0) return { count: 0, line: null }
  const highestRow = base.reduce((a, b) => (a.fundingPercent >= b.fundingPercent ? a : b))
  return {
    count: base.length,
    line: { highestPct: highestRow.fundingPercent, vendorName: highestRow.vendor },
  }
}

function requisitionLineRowsForPr(row: RequisitionRow): RequisitionLineRow[] {
  const preferredVendor = `${row.vendorId} — ${row.vendor}`
  const lineCount = Math.max(10, row.buyerAssignedLineCount)
  return Array.from({ length: lineCount }, (_, i) => {
    const n = i + 1
    const statusEmpty = n === 2
    const qty = n + 1
    const unit = 125.5 * n
    const total = unit * qty
    const itemDescShort =
      n === 1
        ? `Workstation bundle — ${row.vendor}`
        : n % 3 === 0
          ? 'Office supplies kit — catalog'
          : 'Standard hardware line — non-stock'
    return {
      line: String(n),
      status: statusEmpty ? '' : n === 1 ? 'Pending Approval' : 'Buyer Review',
      projectId: `PRJ-${2400 + n}`,
      projectName: n % 2 === 0 ? 'HQ Facilities Refresh' : 'Field Services Expansion',
      item: `ITM-${row.id.replace(/^PR-/, '')}-${String(n).padStart(2, '0')}`,
      rev: n === 1 ? 'A' : 'B',
      itemDesc: itemDescShort,
      lnStatus: n === 1 ? 'Open' : 'Submitted',
      preferredVendor,
      targetPlaceDate: row.needBy,
      daysUntilTarget: 22 - n * 7,
      nextApprover: n === 1 ? row.requestedBy : 'Jamie Chen',
      qty: String(qty),
      unitCost: `$${unit.toFixed(2)}`,
      lineTotalCost: `$${total.toFixed(2)}`,
      accountId: 'ACC-4400',
      accountName: 'Operating Expense',
      orgId: 'ORG-HQ',
      orgName: row.organization,
    }
  })
}

function requisitionReportHref(prId: string) {
  return `#/report/requisition/${encodeURIComponent(prId)}`
}

function projectReportHref(projectId: string) {
  return `#/report/project/${encodeURIComponent(projectId)}`
}

const PROJECT_DETAIL_TAB_PREFIX = 'project-detail:' as const

function projectDetailTabId(projectId: string) {
  return `${PROJECT_DETAIL_TAB_PREFIX}${projectId}`
}

function isProjectDetailTabId(id: string) {
  return id.startsWith(PROJECT_DETAIL_TAB_PREFIX)
}

function projectIdFromDetailTabId(id: string): string | null {
  if (!isProjectDetailTabId(id)) return null
  return id.slice(PROJECT_DETAIL_TAB_PREFIX.length)
}

function findProjectAcrossContracts(projectId: string): {
  project: ContractProjectLine
  contract: RequisitionRow
} | null {
  for (const contract of REQUISITION_ROWS) {
    const project = contract.projects.find((p) => p.id === projectId)
    if (project != null) return { project, contract }
  }
  return null
}

function vendorEmailForRow(row: RequisitionRow): string {
  return contactEmailFromDisplayName(row.vendor, 'vendor')
}

function contactEmailFromDisplayName(name: string, fallbackLocal = 'contact'): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
  return `${slug || fallbackLocal}@example.com`
}

function contractInfoCell(
  row: RequisitionRow,
  opts: {
    expanded: boolean
    onToggleExpand: (e: MouseEvent<HTMLButtonElement>) => void
    onSelectContract: (e: MouseEvent<HTMLButtonElement>) => void
  },
) {
  const hasProjects = row.projects.length > 0
  return (
    <td className="command-center-contract-info">
      <div className="command-center-contract-info__layout">
        {hasProjects ? (
          <button
            type="button"
            className="command-center-contract-info__expand"
            aria-expanded={opts.expanded}
            aria-controls={`contract-projects-${row.id}`}
            aria-label={
              opts.expanded ? `Collapse projects for ${row.contractNumber}` : `Expand projects for ${row.contractNumber}`
            }
            onClick={(e) => opts.onToggleExpand(e)}
          >
            <Icon name={opts.expanded ? 'chevron-down' : 'chevron-right'} size="sm" aria-hidden />
          </button>
        ) : (
          <span className="command-center-contract-info__expand-spacer" aria-hidden />
        )}
        <div className="command-center-contract-info__stack">
          <button
            type="button"
            className="command-center-contract-info__id"
            aria-label={`Open contract ${row.contractNumber}`}
            onClick={opts.onSelectContract}
          >
            {row.contractNumber}
          </button>
          <span className="command-center-contract-info__vendor">{row.vendor}</span>
        </div>
      </div>
    </td>
  )
}

function stripCurrencyDisplay(value: string): string {
  return value.replace(/\$/g, '')
}

function formatFundingPercentDisplay(pct: number): string {
  return `${pct.toFixed(1)}%`
}

function commandCenterHeaderTh(
  label: string,
  align: 'left' | 'right' = 'left',
  title?: string,
  showChrome = true,
) {
  const alignClass = align === 'right' ? 'text-right' : 'text-left'
  const icons = showChrome ? (
    <span className="command-center-th__actions" aria-hidden>
      <Icon name="chevron-up-down" size="xs" />
      <Icon name="funnel" size="xs" />
    </span>
  ) : null
  return (
    <th className={alignClass} scope="col" title={title}>
      <span
        className={
          align === 'right'
            ? 'command-center-th command-center-th--end'
            : 'command-center-th'
        }
      >
        <span className="command-center-th__label">{label}</span>
        {icons}
      </span>
    </th>
  )
}

const REQUISITION_TABLE_HEADER = (
  <thead>
    <tr>
      {commandCenterHeaderTh('Contract Info')}
      {commandCenterHeaderTh('Next Important Date')}
      {commandCenterHeaderTh('Start Date')}
      {commandCenterHeaderTh('End Date')}
      {commandCenterHeaderTh('Contract Value', 'right')}
      {commandCenterHeaderTh('Funded Value', 'right')}
      {commandCenterHeaderTh('Total Revenue', 'right')}
      {commandCenterHeaderTh('Total Cost', 'right')}
      {commandCenterHeaderTh('Funding Used', 'right')}
    </tr>
  </thead>
)

const PR_LINE_DETAILS_TABLE_HEADER = (
  <thead>
    <tr>
      {commandCenterHeaderTh('Line')}
      {commandCenterHeaderTh('Status')}
      {commandCenterHeaderTh('Projects')}
      {commandCenterHeaderTh('Item')}
      {commandCenterHeaderTh('Rev')}
      {commandCenterHeaderTh('Item Desc')}
      {commandCenterHeaderTh('Ln Status')}
      {commandCenterHeaderTh('Preferred Vendor')}
      {commandCenterHeaderTh('Target Place date')}
      {commandCenterHeaderTh('Days Until Target Place Date', 'right')}
      {commandCenterHeaderTh('Next Approver')}
      {commandCenterHeaderTh('Qty', 'right')}
      {commandCenterHeaderTh('Unit Cost', 'right')}
      {commandCenterHeaderTh('Line Total Cost', 'right')}
      {commandCenterHeaderTh('Accounts')}
      {commandCenterHeaderTh('Orgs')}
    </tr>
  </thead>
)

function PrLineDetailsTableBody({ rows }: { rows: RequisitionLineRow[] }) {
  const cell = 'command-center-pr-line-details-table__cell'
  return (
    <tbody>
      {rows.map((r) => (
        <tr key={`${r.line}-${r.item}`}>
          <td className={clsx('text-left', cell)}>{r.line}</td>
          <td className={clsx('text-left', cell)}>{r.status ? r.status : '\u00A0'}</td>
          <td className={clsx('text-left', cell)}>
            {r.projectId} — {r.projectName}
          </td>
          <td className={clsx('text-left', cell)}>{r.item}</td>
          <td className={clsx('text-left', cell)}>{r.rev}</td>
          <td className={clsx('text-left', cell)}>{r.itemDesc}</td>
          <td className={clsx('text-left', cell)}>{r.lnStatus}</td>
          <td className={clsx('text-left', cell)}>{r.preferredVendor}</td>
          <td className={clsx('text-left', cell)}>{r.targetPlaceDate}</td>
          <td
            className={clsx('text-right', cell)}
            style={r.daysUntilTarget < 0 ? { color: 'var(--color-error)' } : undefined}
          >
            {r.daysUntilTarget}
          </td>
          <td className={clsx('text-left', cell)}>{r.nextApprover}</td>
          <td className={clsx('text-right', cell)}>{r.qty}</td>
          <td className={clsx('text-right', cell)}>{r.unitCost}</td>
          <td className={clsx('text-right', cell)}>{r.lineTotalCost}</td>
          <td className={clsx('text-left', cell)}>
            {r.accountId} — {r.accountName}
          </td>
          <td className={clsx('text-left', cell)}>
            {r.orgId} — {r.orgName}
          </td>
        </tr>
      ))}
    </tbody>
  )
}

type SelectedProjectRef = {
  contractId: string
  projectId: string
}

function RequisitionTableBody({
  rows,
  selectedId,
  selectedProject,
  onSelectRow,
  onSelectProject,
  expandedContractIds,
  onToggleContractExpanded,
}: {
  rows: RequisitionRow[]
  selectedId: string | null
  selectedProject: SelectedProjectRef | null
  onSelectRow: (id: string) => void
  onSelectProject: (ref: SelectedProjectRef) => void
  expandedContractIds: readonly string[]
  onToggleContractExpanded: (rowId: string) => void
}) {
  return (
    <tbody>
      {rows.map((row) => {
        const expanded = expandedContractIds.includes(row.id)
        return (
          <Fragment key={row.id}>
            <tr
              className={clsx(
                'command-center-table-row--selectable',
                selectedId === row.id && 'table-row--selected',
              )}
              tabIndex={0}
              aria-selected={selectedId === row.id ? 'true' : 'false'}
              onClick={() => onSelectRow(row.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectRow(row.id)
                }
              }}
            >
              {contractInfoCell(row, {
                expanded,
                onToggleExpand: (e) => {
                  e.stopPropagation()
                  onToggleContractExpanded(row.id)
                },
                onSelectContract: (e) => {
                  e.stopPropagation()
                  onSelectRow(row.id)
                },
              })}
              <td>{formatTableDate(row.nextImportantDate)}</td>
              <td>{formatTableDate(row.startDate)}</td>
              <td>{formatTableDate(row.needBy)}</td>
              <td className="text-right">{stripCurrencyDisplay(row.amount)}</td>
              <td className="text-right">{stripCurrencyDisplay(row.fundedValue)}</td>
              <td className="text-right">{stripCurrencyDisplay(row.itdRevenue)}</td>
              <td className="text-right">{stripCurrencyDisplay(row.itdCost)}</td>
              <td
                className={clsx(
                  'text-right',
                  row.fundingPercent >= 65 && 'command-center-funding-used--high',
                )}
              >
                {formatFundingPercentDisplay(row.fundingPercent)}
              </td>
            </tr>
            {expanded &&
              row.projects.map((proj, projIdx) => {
                const projectSelected =
                  selectedProject?.contractId === row.id &&
                  selectedProject.projectId === proj.id
                const selectThisProject = () =>
                  onSelectProject({ contractId: row.id, projectId: proj.id })
                return (
                <tr
                  key={`${row.id}-proj-${proj.id}`}
                  className={clsx(
                    'command-center-contract-project-row',
                    'command-center-table-row--project',
                    'command-center-table-row--selectable',
                    projectSelected && 'table-row--selected',
                  )}
                  tabIndex={0}
                  aria-selected={projectSelected ? 'true' : 'false'}
                  onClick={selectThisProject}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selectThisProject()
                    }
                  }}
                >
                  <td
                    className="command-center-contract-project-row__first"
                    id={projIdx === 0 ? `contract-projects-${row.id}` : undefined}
                  >
                    <div className="command-center-contract-project-row__indent">
                      <div className="command-center-contract-project-row__stack">
                        <button
                          type="button"
                          className="command-center-contract-project-row__id"
                          aria-label={`Open project ${proj.id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            selectThisProject()
                          }}
                        >
                          {proj.id}
                        </button>
                        <span className="command-center-contract-project-row__name">{proj.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="command-center-table-cell--no-next-date" aria-label="No next important date">
                    {'\u00A0'}
                  </td>
                  <td>{formatTableDate(proj.startDate)}</td>
                  <td>{formatTableDate(proj.endDate)}</td>
                  <td className="text-right">{stripCurrencyDisplay(proj.contractValue)}</td>
                  <td className="text-right">{stripCurrencyDisplay(proj.fundedValue)}</td>
                  <td className="text-right">{stripCurrencyDisplay(proj.itdRevenue)}</td>
                  <td className="text-right">{stripCurrencyDisplay(proj.itdCost)}</td>
                  <td
                    className={clsx(
                      'text-right',
                      proj.fundingPercent >= 65 && 'command-center-funding-used--high',
                    )}
                  >
                    {formatFundingPercentDisplay(proj.fundingPercent)}
                  </td>
                </tr>
                )
              })}
          </Fragment>
        )
      })}
    </tbody>
  )
}

const DEMO_POP_ELAPSED_PCT = 90

function PeriodHealthMetrics({
  subjectLabel,
  popElapsedPct,
  fundsUsedPct,
}: {
  subjectLabel: string
  popElapsedPct: number
  fundsUsedPct: number
}) {
  return (
    <div
      className="command-center-period-health"
      aria-label={`Period health for ${subjectLabel}. Contract at risk: Yes. PoP elapsed ${popElapsedPct} percent. Funds used ${fundsUsedPct} percent.`}
    >
      <ul className="command-center-period-health__metrics">
        <li className="command-center-period-health__row command-center-period-health__row--at-risk">
          <span className="command-center-period-health__metric-label">Contract At Risk</span>
          <span className="command-center-period-health__at-risk-value">
            <Icon name="check" size="sm" className="command-center-period-health__at-risk-icon" />
            Yes
          </span>
        </li>
        <li className="command-center-period-health__row">
          <span className="command-center-period-health__metric-label">PoP Elapsed</span>
          <div className="command-center-period-health__track" role="presentation" aria-hidden>
            <div
              className="command-center-period-health__fill"
              style={{ width: `${popElapsedPct}%` }}
            />
          </div>
          <span className="command-center-period-health__pct">{popElapsedPct}%</span>
        </li>
        <li className="command-center-period-health__row">
          <span className="command-center-period-health__metric-label">Funds Used</span>
          <div className="command-center-period-health__track" role="presentation" aria-hidden>
            <div
              className="command-center-period-health__fill"
              style={{ width: `${Math.min(100, fundsUsedPct)}%` }}
            />
          </div>
          <span className="command-center-period-health__pct">{fundsUsedPct}%</span>
        </li>
      </ul>
    </div>
  )
}

function RequisitionSidePanel({
  row,
  onClose,
  onOpenRequisitionReportTab,
  summaryAccordionOpen,
  onSummaryAccordionOpenChange,
}: {
  row: RequisitionRow
  onClose: () => void
  onOpenRequisitionReportTab: (prId: string) => void
  summaryAccordionOpen: boolean
  onSummaryAccordionOpenChange: (open: boolean) => void
}) {
  const reportHref = requisitionReportHref(row.id)
  const fundingUsedHigh = row.fundingPercent > 65
  const [vendorEmailOpen, setVendorEmailOpen] = useState(false)

  return (
    <>
    <aside
      className="command-center-requisition-panel"
      aria-label={`Contract details for ${row.contractNumber}`}
      aria-labelledby="cc-req-panel-title"
    >
      <header className="command-center-requisition-panel__header">
        <h2 className="command-center-requisition-panel__title" id="cc-req-panel-title">
          Contract Details
        </h2>
        <button
          type="button"
          className="command-center-requisition-panel__close"
          aria-label="Close panel"
          onClick={onClose}
        >
          <Icon name="x-mark" size="sm" />
        </button>
      </header>
      <div className="command-center-requisition-panel__intro">
        <div className="command-center-requisition-panel__pr-row">
          <span className="command-center-requisition-panel__pr-id">{row.contractNumber}</span>
          <div className="command-center-requisition-panel__report-links">
            <Link
              href={reportHref}
              size="small"
              title="Open Contract Brief in a Command Center tab"
              onClick={(e) => {
                e.preventDefault()
                onOpenRequisitionReportTab(row.id)
              }}
            >
              Contract Brief
            </Link>
            <Link
              href="#"
              size="small"
              title="Open Smart Summaries"
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault()
              }}
            >
              Smart Summaries
            </Link>
          </div>
        </div>
      </div>
      <div
        className={clsx(
          'command-center-requisition-panel__funding-strip',
          fundingUsedHigh
            ? 'command-center-requisition-panel__funding-strip--warn'
            : 'command-center-requisition-panel__funding-strip--neutral',
        )}
      >
        <div
          className="command-center-requisition-panel__stat-callout"
          aria-label={`Funding used ${row.fundingPercent} percent`}
        >
          <p className="command-center-requisition-panel__stat-callout-pct">{row.fundingPercent}%</p>
          <p className="command-center-requisition-panel__stat-callout-label">Funding used</p>
        </div>
      </div>
      <div className="command-center-requisition-panel__body">
        <RequisitionRevenueInformation row={row} />
        <RequisitionDetailSummary
          row={row}
          open={summaryAccordionOpen}
          onOpenChange={onSummaryAccordionOpenChange}
          onVendorClick={() => setVendorEmailOpen(true)}
        />
      </div>
    </aside>
    <VendorEmailDialog
      row={row}
      open={vendorEmailOpen}
      onClose={() => setVendorEmailOpen(false)}
    />
    </>
  )
}

const PROJECT_UPDATE_STATUS_DEMO = {
  projectStatusUpdate: '12/4/2024, 1:22 PM',
  pendingReportUpdate: '',
} as const

function ProjectUpdateStatusPanel() {
  return (
    <dl className="command-center-panel-fields">
      <div className="command-center-panel-fields__field">
        <dt className="command-center-panel-fields__label">Project Status Update</dt>
        <dd className="command-center-panel-fields__value">
          {PROJECT_UPDATE_STATUS_DEMO.projectStatusUpdate}
        </dd>
      </div>
      <div className="command-center-panel-fields__field">
        <dt className="command-center-panel-fields__label">Pending Report Update</dt>
        <dd className="command-center-panel-fields__value">
          {PROJECT_UPDATE_STATUS_DEMO.pendingReportUpdate}
        </dd>
      </div>
    </dl>
  )
}

function ProjectRevenueInformation({ project }: { project: ContractProjectLine }) {
  const contract = moneySplit(parseMoneyAmount(project.contractValue))
  const funded = moneySplit(parseMoneyAmount(project.fundedValue))
  const totalCost = moneySplit(parseMoneyAmount(project.itdCost))
  const revenue = moneySplit(parseMoneyAmount(project.itdRevenue))

  return (
    <details className="command-center-requisition-accordion" open>
      <summary className="command-center-requisition-accordion__summary">
        <span className="command-center-requisition-accordion__summary-main">
          <Icon
            name="chevron-right"
            size="sm"
            className="command-center-requisition-accordion__expand-icon"
            aria-hidden
          />
          <span className="command-center-requisition-accordion__summary-text">
            Revenue Information
          </span>
        </span>
      </summary>
      <div className="command-center-requisition-accordion__content">
        <table className="command-center-stat-table command-center-revenue-info-table">
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">ITD</th>
              <th scope="col">Pending</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="command-center-stat-table__label">Contract Value</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(contract.itd)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(contract.pending)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(contract.total)}</td>
            </tr>
            <tr>
              <td className="command-center-stat-table__label">Funded Value</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(funded.itd)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(funded.pending)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(funded.total)}</td>
            </tr>
            <tr>
              <td className="command-center-stat-table__label">Total Cost</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(totalCost.itd)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(totalCost.pending)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(totalCost.total)}</td>
            </tr>
            <tr>
              <td className="command-center-stat-table__label">Revenue</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(revenue.itd)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(revenue.pending)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(revenue.total)}</td>
            </tr>
          </tbody>
        </table>
        <div className="command-center-revenue-health-card">
          <ProjectUpdateStatusPanel />
        </div>
      </div>
    </details>
  )
}

const PROJECT_INFORMATION_DEMO = {
  projectManager: 'Wilderman, Amber',
  periodOfPerformance: '09/25/2023 - 09/25/2024',
  customerName: 'ABC Corp',
  owningOrganization: 'Manufacturing',
  contractorRepresentative: 'Roland Chang',
  aco: 'Ricky Spanish',
  projectType: 'Government',
  revenueFormula: 'Revenue Description (ETBAR)',
} as const

function ProjectDetailSummary({
  open,
  onOpenChange,
  onEmailContact,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  onEmailContact: (name: string) => void
}) {
  const info = PROJECT_INFORMATION_DEMO

  return (
    <details
      className="command-center-requisition-accordion"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary className="command-center-requisition-accordion__summary">
        <span className="command-center-requisition-accordion__summary-main">
          <Icon
            name="chevron-right"
            size="sm"
            className="command-center-requisition-accordion__expand-icon"
            aria-hidden
          />
          <span className="command-center-requisition-accordion__summary-text">
            Project Information
          </span>
        </span>
      </summary>
      <div className="command-center-requisition-accordion__content">
        <div className="command-center-requisition-summary__grid">
          <ContractSummaryField
            label="Project Manager"
            value={info.projectManager}
            onValueClick={() => onEmailContact(info.projectManager)}
            emailLink
          />
          <ContractSummaryField label="Period of Performance" value={info.periodOfPerformance} />
          <ContractSummaryField label="Customer Name" value={info.customerName} />
          <ContractSummaryField label="Owning Organization" value={info.owningOrganization} />
          <ContractSummaryField
            label="Contractor Representative"
            value={info.contractorRepresentative}
            onValueClick={() => onEmailContact(info.contractorRepresentative)}
            emailLink
          />
          <ContractSummaryField
            label="Administrative Contracting Officer"
            value={info.aco}
            onValueClick={() => onEmailContact(info.aco)}
            emailLink
          />
          <ContractSummaryField label="Project Type" value={info.projectType} />
          <ContractSummaryField label="Revenue Formula" value={info.revenueFormula} />
        </div>
      </div>
    </details>
  )
}

function ProjectSidePanel({
  project,
  contract,
  onClose,
  onOpenProjectReportTab,
  summaryAccordionOpen,
  onSummaryAccordionOpenChange,
}: {
  project: ContractProjectLine
  contract: RequisitionRow
  onClose: () => void
  onOpenProjectReportTab: (projectId: string) => void
  summaryAccordionOpen: boolean
  onSummaryAccordionOpenChange: (open: boolean) => void
}) {
  const fundingUsedHigh = project.fundingPercent > 65
  const [emailRecipient, setEmailRecipient] = useState<string | null>(null)
  const reportHref = projectReportHref(project.id)
  const reportLabel = `${project.name} Report`

  return (
    <>
    <aside
      className="command-center-requisition-panel"
      aria-label={`Project details for ${project.id}`}
      aria-labelledby="cc-project-panel-title"
    >
      <header className="command-center-requisition-panel__header">
        <h2 className="command-center-requisition-panel__title" id="cc-project-panel-title">
          Project Details
        </h2>
        <button
          type="button"
          className="command-center-requisition-panel__close"
          aria-label="Close panel"
          onClick={onClose}
        >
          <Icon name="x-mark" size="sm" />
        </button>
      </header>
      <div className="command-center-requisition-panel__intro">
        <div className="command-center-requisition-panel__pr-row">
          <span className="command-center-requisition-panel__pr-id">{project.id}</span>
          <div className="command-center-requisition-panel__report-links">
            <Link
              href={reportHref}
              size="small"
              title={`Open ${reportLabel} in a Command Center tab`}
              onClick={(e) => {
                e.preventDefault()
                onOpenProjectReportTab(project.id)
              }}
            >
              {reportLabel}
            </Link>
          </div>
        </div>
      </div>
      <div
        className={clsx(
          'command-center-requisition-panel__funding-strip',
          fundingUsedHigh
            ? 'command-center-requisition-panel__funding-strip--warn'
            : 'command-center-requisition-panel__funding-strip--neutral',
        )}
      >
        <div
          className="command-center-requisition-panel__stat-callout"
          aria-label={`Funding used ${project.fundingPercent} percent`}
        >
          <p className="command-center-requisition-panel__stat-callout-pct">{project.fundingPercent}%</p>
          <p className="command-center-requisition-panel__stat-callout-label">Funding used</p>
        </div>
      </div>
      <div className="command-center-requisition-panel__body">
        <ProjectRevenueInformation project={project} />
        <ProjectDetailSummary
          open={summaryAccordionOpen}
          onOpenChange={onSummaryAccordionOpenChange}
          onEmailContact={setEmailRecipient}
        />
      </div>
    </aside>
    <VendorEmailDialog
      row={contract}
      open={emailRecipient != null}
      onClose={() => setEmailRecipient(null)}
      recipientName={emailRecipient ?? undefined}
    />
    </>
  )
}

function VendorEmailDialog({
  row,
  open,
  onClose,
  recipientName,
}: {
  row: RequisitionRow
  open: boolean
  onClose: () => void
  /** When set, emails this person instead of the contract vendor. */
  recipientName?: string
}) {
  const displayName = recipientName ?? row.vendor
  const to =
    recipientName != null
      ? contactEmailFromDisplayName(recipientName)
      : vendorEmailForRow(row)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    if (!open) return
    setSubject('')
    setBody('')
  }, [open, row.id, displayName])

  return (
    <Dialog
      id={`vendor-email-${row.id}-${displayName}`}
      title={`Email ${displayName}`}
      open={open}
      onClose={onClose}
      resizable={false}
      footer={
        <div className="dialog__footer-actions">
          <Button buttonType="theme" variant="primary" onClick={onClose}>
            Send
          </Button>
          <Button buttonType="theme" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="command-center-vendor-email">
        <Input label="To" labelVariant="stacked" type="email" value={to} readOnly />
        <Input
          label="Subject"
          labelVariant="stacked"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Textarea
          label="Message"
          labelVariant="stacked"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
    </Dialog>
  )
}

function ContractSummaryField({
  label,
  value,
  onValueClick,
  emailLink = false,
}: {
  label: string
  value: string
  onValueClick?: () => void
  emailLink?: boolean
}) {
  return (
    <div className="command-center-requisition-summary__field">
      <div className="command-center-requisition-summary__label">{label}</div>
      <div className="command-center-requisition-summary__value">
        {onValueClick != null ? (
          <Link
            href="#"
            size="small"
            title={emailLink ? `Compose email to ${value}` : `Email ${value}`}
            className={emailLink ? 'command-center-summary-email-link' : undefined}
            onClick={(e: MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault()
              onValueClick()
            }}
          >
            {emailLink && <Icon name="envelope" size="xs" aria-hidden />}
            {value}
          </Link>
        ) : (
          value
        )}
      </div>
    </div>
  )
}

function parseMoneyAmount(value: string): number {
  const n = Number(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function formatMoneyAmount(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Split a total into ITD / Pending using an 90/10 ratio for demo detail rows. */
function moneySplit(total: number): { itd: number; pending: number; total: number } {
  const itd = Math.round(total * 0.9 * 100) / 100
  const pending = Math.round((total - itd) * 100) / 100
  return { itd, pending, total }
}

function RequisitionRevenueInformation({ row }: { row: RequisitionRow }) {
  const contract = moneySplit(parseMoneyAmount(row.amount))
  const funded = moneySplit(parseMoneyAmount(row.fundedValue))
  const totalCost = moneySplit(parseMoneyAmount(row.itdCost))
  const revenue = moneySplit(parseMoneyAmount(row.itdRevenue))
  const popElapsedPct = DEMO_POP_ELAPSED_PCT
  const fundsUsedPct = row.fundingPercent

  return (
    <details className="command-center-requisition-accordion" open>
      <summary className="command-center-requisition-accordion__summary">
        <span className="command-center-requisition-accordion__summary-main">
          <Icon
            name="chevron-right"
            size="sm"
            className="command-center-requisition-accordion__expand-icon"
            aria-hidden
          />
          <span className="command-center-requisition-accordion__summary-text">
            Revenue Information
          </span>
        </span>
      </summary>
      <div className="command-center-requisition-accordion__content">
        <table className="command-center-stat-table command-center-revenue-info-table">
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col">ITD</th>
              <th scope="col">Pending</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="command-center-stat-table__label">Contract Value</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(contract.itd)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(contract.pending)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(contract.total)}</td>
            </tr>
            <tr>
              <td className="command-center-stat-table__label">Funded Value</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(funded.itd)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(funded.pending)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(funded.total)}</td>
            </tr>
            <tr>
              <td className="command-center-stat-table__label">Total Cost</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(totalCost.itd)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(totalCost.pending)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(totalCost.total)}</td>
            </tr>
            <tr>
              <td className="command-center-stat-table__label">Revenue</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(revenue.itd)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(revenue.pending)}</td>
              <td className="command-center-stat-table__num">{formatMoneyAmount(revenue.total)}</td>
            </tr>
          </tbody>
        </table>
        <div className="command-center-revenue-health-card">
          <PeriodHealthMetrics
            subjectLabel={row.contractNumber}
            popElapsedPct={popElapsedPct}
            fundsUsedPct={fundsUsedPct}
          />
        </div>
      </div>
    </details>
  )
}

function RequisitionDetailSummary({
  row,
  open,
  onOpenChange,
  onVendorClick,
}: {
  row: RequisitionRow
  open: boolean
  onOpenChange: (next: boolean) => void
  onVendorClick: () => void
}) {
  return (
    <details
      className="command-center-requisition-accordion"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary className="command-center-requisition-accordion__summary">
        <span className="command-center-requisition-accordion__summary-main">
          <Icon
            name="chevron-right"
            size="sm"
            className="command-center-requisition-accordion__expand-icon"
            aria-hidden
          />
          <span className="command-center-requisition-accordion__summary-text">
            Contract Information
          </span>
        </span>
      </summary>
      <div className="command-center-requisition-accordion__content">
        <div className="command-center-requisition-summary__grid">
          <ContractSummaryField label="Customer name" value={row.vendor} />
          <ContractSummaryField
            label="Customer Contact"
            value="James Smith"
            onValueClick={onVendorClick}
            emailLink
          />
          <ContractSummaryField label="Manager" value={row.managerName} />
          <ContractSummaryField label="Contract Type" value={row.contractType} />
          <ContractSummaryField label="Project Type" value={row.projectType} />
          <ContractSummaryField label="Contract Status" value="Awarded" />
          <ContractSummaryField label="Prime Contract No" value={row.primeContractNo} />
          <ContractSummaryField label="Task Order no" value={row.taskOrderNo} />
          <ContractSummaryField label="Business Unit" value="Consulting" />
          <ContractSummaryField label="Organization" value="Construction Management" />
          <ContractSummaryField label="Contract Vehicle" value={row.contractVehicle} />
        </div>
      </div>
    </details>
  )
}

type PoOrderSummaryFields = {
  release: string
  buyer: string
  type: string
  numberOfLines: number
  vendorName: string
  dueDate: string
  dpasRating: string
}

/** PR Summary fields for order detail (reference layout). */
const PO_ORDER_SUMMARY_BY_ID: Record<string, PoOrderSummaryFields> = {
  'PO-1039': {
    release: 'REL-2024-001',
    buyer: 'John Smith',
    type: 'Standard',
    numberOfLines: 24,
    vendorName: 'Industrial Supply Co.',
    dueDate: '11/15/2024',
    dpasRating: 'Y',
  },
  'PO-1040': {
    release: 'REL-2024-014',
    buyer: 'Alex Rivera',
    type: 'Blanket',
    numberOfLines: 12,
    vendorName: 'Northwind Logistics',
    dueDate: '12/02/2024',
    dpasRating: 'N',
  },
  'PO-1041': {
    release: 'REL-2024-022',
    buyer: 'Priya Nair',
    type: 'Sub Contract',
    numberOfLines: 8,
    vendorName: 'Contoso Services',
    dueDate: '01/08/2025',
    dpasRating: 'Y',
  },
}

function PoOrderPrSummaryAccordion({ poId }: { poId: string }) {
  const summary = PO_ORDER_SUMMARY_BY_ID[poId] ?? PO_ORDER_SUMMARY_BY_ID['PO-1039']
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setOpen(true)
  }, [poId])

  return (
    <details
      className="command-center-requisition-accordion"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="command-center-requisition-accordion__summary">
        <span className="command-center-requisition-accordion__summary-main">
          <Icon
            name="chevron-right"
            size="sm"
            className="command-center-requisition-accordion__expand-icon"
            aria-hidden
          />
          <span className="command-center-requisition-accordion__summary-text">PR Summary: {poId}</span>
        </span>
      </summary>
      <div className="command-center-requisition-accordion__content">
        <div className="command-center-requisition-summary__grid">
          <div className="command-center-requisition-summary__field">
            <div className="command-center-requisition-summary__label">Release</div>
            <div className="command-center-requisition-summary__value">{summary.release}</div>
          </div>
          <div className="command-center-requisition-summary__field">
            <div className="command-center-requisition-summary__label">Buyer</div>
            <div className="command-center-requisition-summary__value">{summary.buyer}</div>
          </div>
          <div className="command-center-requisition-summary__field">
            <div className="command-center-requisition-summary__label">Type</div>
            <div className="command-center-requisition-summary__value">{summary.type}</div>
          </div>
          <div className="command-center-requisition-summary__field">
            <div className="command-center-requisition-summary__label">Number of Lines</div>
            <div className="command-center-requisition-summary__value">{summary.numberOfLines}</div>
          </div>
          <div className="command-center-requisition-summary__field">
            <div className="command-center-requisition-summary__label">Vendor Name</div>
            <div className="command-center-requisition-summary__value">{summary.vendorName}</div>
          </div>
          <div className="command-center-requisition-summary__field">
            <div className="command-center-requisition-summary__label">Due Date</div>
            <div className="command-center-requisition-summary__value">{summary.dueDate}</div>
          </div>
          <div className="command-center-requisition-summary__field">
            <div className="command-center-requisition-summary__label">DPAS Rating</div>
            <div className="command-center-requisition-summary__value">{summary.dpasRating}</div>
          </div>
        </div>
      </div>
    </details>
  )
}

function PoOrderDetailView({ poId }: { poId: string }) {
  return (
    <div className="command-center-order-detail">
      <PoOrderPrSummaryAccordion poId={poId} />
      <div className="command-center-order-detail__line-details">
        <h2 className="command-center-order-detail__section-title">Line Details</h2>
        <p className="command-center-order-detail__placeholder">Table rows can be wired to live data next.</p>
      </div>
    </div>
  )
}

function RequisitionDetailsTabView({ prId }: { prId: string }) {
  const row = REQUISITION_ROWS.find((r) => r.id === prId)
  const lineRows = useMemo(() => (row != null ? requisitionLineRowsForPr(row) : []), [row])
  if (row == null) {
    return (
      <div className="command-center-order-detail-wrap">
        <p className="command-center-order-detail__placeholder">Requisition {prId} was not found.</p>
      </div>
    )
  }
  return (
    <section className="command-center-pr-report-section" aria-label="Requisition report">
      <div className="command-center-pr-summary-panel">
        <h2 id="cc-pr-summary-heading" className="command-center-pr-summary-panel__heading">
          PR Summary : {row.id}
        </h2>
        <div className="command-center-pr-summary-panel__row" role="group" aria-label="Requisition summary fields">
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">PR ID</div>
            <div className="command-center-pr-summary-panel__value">{row.id}</div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Preferred Vendor</div>
            <div className="command-center-pr-summary-panel__value">
              {row.vendorId} — {row.vendor}
            </div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">No. of Lines</div>
            <div className="command-center-pr-summary-panel__value">{row.buyerAssignedLineCount}</div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Target Place Date</div>
            <div className="command-center-pr-summary-panel__value">{row.needBy}</div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Total Amt</div>
            <div className="command-center-pr-summary-panel__value">{row.amount}</div>
          </div>
        </div>
      </div>

      <div className="command-center-pr-line-details-panel" aria-labelledby="cc-pr-line-details-heading">
        <h2 id="cc-pr-line-details-heading" className="command-center-pr-line-details-panel__heading">
          Line details
        </h2>
        <div className="command-center-pr-line-details-panel__table-scroll">
          <Table
            headerVariant="white"
            striped
            className="command-center-data-table command-center-pr-line-details-table"
            header={PR_LINE_DETAILS_TABLE_HEADER}
            body={<PrLineDetailsTableBody rows={lineRows} />}
          />
        </div>
      </div>
    </section>
  )
}

function ProjectReportTabView({ projectId }: { projectId: string }) {
  const found = findProjectAcrossContracts(projectId)
  const info = PROJECT_INFORMATION_DEMO

  if (found == null) {
    return (
      <div className="command-center-order-detail-wrap">
        <p className="command-center-order-detail__placeholder">Project {projectId} was not found.</p>
      </div>
    )
  }

  const { project, contract } = found
  const reportTitle = `${project.name} Report`

  return (
    <section className="command-center-pr-report-section" aria-label={reportTitle}>
      <div className="command-center-pr-summary-panel">
        <h2 id="cc-project-report-heading" className="command-center-pr-summary-panel__heading">
          {reportTitle}
        </h2>
        <div
          className="command-center-pr-summary-panel__row"
          role="group"
          aria-label="Project report summary fields"
        >
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Project ID</div>
            <div className="command-center-pr-summary-panel__value">{project.id}</div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Contract</div>
            <div className="command-center-pr-summary-panel__value">{contract.contractNumber}</div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Customer</div>
            <div className="command-center-pr-summary-panel__value">{info.customerName}</div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Project Manager</div>
            <div className="command-center-pr-summary-panel__value">{info.projectManager}</div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Period of Performance</div>
            <div className="command-center-pr-summary-panel__value">
              {project.startDate} – {project.endDate}
            </div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Funding Used</div>
            <div className="command-center-pr-summary-panel__value">
              {formatFundingPercentDisplay(project.fundingPercent)}
            </div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Contract Value</div>
            <div className="command-center-pr-summary-panel__value">
              {stripCurrencyDisplay(project.contractValue)}
            </div>
          </div>
          <div className="command-center-pr-summary-panel__cell">
            <div className="command-center-pr-summary-panel__label">Funded Value</div>
            <div className="command-center-pr-summary-panel__value">
              {stripCurrencyDisplay(project.fundedValue)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HomeShell() {
  const [activeTabId, setActiveTabId] = useState<string>('requisitions')
  const [prDetailRequisitionIds, setPrDetailRequisitionIds] = useState<string[]>([])
  const [poDetailOrderIds, setPoDetailOrderIds] = useState<string[]>([])
  const [projectDetailIds, setProjectDetailIds] = useState<string[]>([])
  const [refreshTick, setRefreshTick] = useState(0)
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<SelectedProjectRef | null>(null)
  const [reqPanelSummaryOpen, setReqPanelSummaryOpen] = useState(true)
  const [projectPanelSummaryOpen, setProjectPanelSummaryOpen] = useState(true)
  const [expirationTierFilter, setExpirationTierFilter] = useState<ExpirationTierKey | null>(null)
  /* Fixed since the header's View picker was removed. */
  const vizDesignOption: VizDesignOption = 'option5'
  const dailyChartIteration: DailyChartIteration = 'iteration1'
  const [expandedContractIds, setExpandedContractIds] = useState<string[]>([])
  const [interactionRulesOpen, setInteractionRulesOpen] = useState(false)
  const [navPanelOpen, setNavPanelOpen] = useState(false)
  /** Command Center rail item swaps the workspace for an empty canvas. */
  const [blankCommandCenter, setBlankCommandCenter] = useState(true)
  /** Configure Settings adds a second shell below the empty canvas. */
  const [settingsShellOpen, setSettingsShellOpen] = useState(true)
  const [settingsActiveTabId, setSettingsActiveTabId] = useState(SETTINGS_SHELL_TABS[0].id)
  const [settingsDesign, setSettingsDesign] = useState('design-1')
  const [delaAiEnabled, setDelaAiEnabled] = useState(false)
  /** Org level is scoped per application tab, so each tab keeps its own choice. */
  const [orgLevelByTab, setOrgLevelByTab] = useState<Record<string, string>>({})
  const [roleSettings, setRoleSettings] =
    useState<Record<string, string | number | boolean>>(DEFAULT_ROLE_SETTINGS)
  const kpiFilterZoneRef = useRef<HTMLDivElement>(null)
  const themeProps = THEME_SHELL_PROPS[DEFAULT_THEME] ?? THEME_SHELL_PROPS['theme-cp']

  useEffect(() => {
    if (SETTINGS_SHELL_TABS.some((tab) => tab.id === settingsActiveTabId)) return
    setSettingsActiveTabId(SETTINGS_SHELL_TABS[0].id)
  }, [settingsActiveTabId])

  const handleSelectKpiTier = useCallback((tier: ExpirationTierKey) => {
    setExpirationTierFilter((prev) => (prev === tier ? null : tier))
  }, [])

  const handleLeftSidebarItemActivate = useCallback(
    ({ item }: LeftSidebarItemActivateDetail) => {
      if (item.label !== COMMAND_CENTER_NAV_LABEL) return
      const nextBlank = !blankCommandCenter
      setBlankCommandCenter(nextBlank)
      setNavPanelOpen(nextBlank)
      if (!nextBlank) {
        setSettingsShellOpen(false)
        setSettingsActiveTabId(SETTINGS_SHELL_TABS[0].id)
        setSettingsDesign('design-1')
      }
    },
    [blankCommandCenter],
  )

  useEffect(() => {
    if (!navPanelOpen) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      const insidePanel = document.querySelector('.left-nav-panel')?.contains(target) ?? false
      const insideRail =
        document.querySelector('.shell-layout__left-sidebar')?.contains(target) ?? false
      if (!insidePanel && !insideRail) setNavPanelOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavPanelOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [navPanelOpen])

  const toggleContractExpanded = useCallback((rowId: string) => {
    setExpandedContractIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId],
    )
  }, [])

  const expirationTierCounts = useMemo(() => summarizeExpirationTierCounts(REQUISITION_ROWS), [])

  const expirationTierContracts = useMemo(
    () => summarizeExpirationTierContracts(REQUISITION_ROWS),
    [],
  )

  const expirationTierExpiryLines = useMemo(
    () => summarizeExpirationTierFirstExpiry(REQUISITION_ROWS),
    [],
  )

  const highFundingSummary = useMemo(() => summarizeHighFunding(REQUISITION_ROWS), [])

  const fundingUtilization = useMemo(
    () => summarizeFundingUtilization(REQUISITION_ROWS),
    [],
  )

  const filteredRequisitionRows = useMemo(
    () => filterRowsByKpiSelection(REQUISITION_ROWS, expirationTierFilter),
    [expirationTierFilter],
  )

  const sortedFilteredRequisitionRows = useMemo(
    () =>
      [...filteredRequisitionRows].sort(
        (a, b) => parseDisplayDate(a.nextImportantDate) - parseDisplayDate(b.nextImportantDate),
      ),
    [filteredRequisitionRows],
  )

  const selectedRequisition = useMemo(
    () => sortedFilteredRequisitionRows.find((r) => r.id === selectedRequisitionId) ?? null,
    [sortedFilteredRequisitionRows, selectedRequisitionId],
  )

  const selectedProjectContext = useMemo(() => {
    if (selectedProject == null) return null
    const contract =
      sortedFilteredRequisitionRows.find((r) => r.id === selectedProject.contractId) ?? null
    if (contract == null) return null
    const project = contract.projects.find((p) => p.id === selectedProject.projectId)
    if (project == null) return null
    return { contract, project }
  }, [sortedFilteredRequisitionRows, selectedProject])

  const selectContractRow = useCallback((id: string) => {
    setSelectedProject(null)
    setSelectedRequisitionId(id)
  }, [])

  const selectProjectRow = useCallback((ref: SelectedProjectRef) => {
    setSelectedRequisitionId(null)
    setSelectedProject(ref)
  }, [])

  const closeDetailPanel = useCallback(() => {
    setSelectedRequisitionId(null)
    setSelectedProject(null)
  }, [])

  useEffect(() => {
    setReqPanelSummaryOpen(true)
  }, [selectedRequisitionId])

  useEffect(() => {
    setProjectPanelSummaryOpen(true)
  }, [selectedProject])

  useEffect(() => {
    if (selectedRequisitionId == null) return
    if (!filteredRequisitionRows.some((r) => r.id === selectedRequisitionId)) {
      setSelectedRequisitionId(null)
    }
  }, [filteredRequisitionRows, selectedRequisitionId])

  useEffect(() => {
    if (selectedProject == null) return
    const contract = filteredRequisitionRows.find((r) => r.id === selectedProject.contractId)
    if (contract == null || !contract.projects.some((p) => p.id === selectedProject.projectId)) {
      setSelectedProject(null)
    }
  }, [filteredRequisitionRows, selectedProject])

  useEffect(() => {
    if (expirationTierFilter === null) return
    const onDocPointerDown = (e: PointerEvent) => {
      const el = kpiFilterZoneRef.current
      if (el != null && !el.contains(e.target as Node)) {
        setExpirationTierFilter(null)
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [expirationTierFilter])

  /*
   * Right rail lines up with the home shell's top-right control — the tab row's
   * refresh button, or the panel header's window controls once the tab row is
   * swapped out. Its offset is set by the page header and card chrome above it
   * rather than by a fixed token sum. Measured at the unscrolled position so the
   * fixed rail keeps its anchor once the content scrolls away.
   */
  useEffect(() => {
    const syncRightRailTop = () => {
      const anchor =
        document.querySelector<HTMLElement>('.command-center-tab-row__refresh') ??
        document.querySelector<HTMLElement>('.command-center-home .card__header-actions')
      const main = document.querySelector<HTMLElement>('.shell-layout__main')
      if (anchor == null || main == null) return
      const top = anchor.getBoundingClientRect().top + main.scrollTop
      document.documentElement.style.setProperty('--cc-right-rail-top', `${top}px`)
    }

    syncRightRailTop()
    const observer = new ResizeObserver(syncRightRailTop)
    const main = document.querySelector<HTMLElement>('.shell-layout__main')
    if (main != null) observer.observe(main)
    window.addEventListener('resize', syncRightRailTop)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncRightRailTop)
      document.documentElement.style.removeProperty('--cc-right-rail-top')
    }
  }, [activeTabId, blankCommandCenter, settingsShellOpen])

  useEffect(() => {
    const logoLink = document.querySelector<HTMLAnchorElement>(
      '.shell-layout__header .header__brand-link',
    )
    if (logoLink == null) return

    const onLogoClick = (e: globalThis.MouseEvent) => {
      e.preventDefault()
      setInteractionRulesOpen(true)
    }

    logoLink.addEventListener('click', onLogoClick)
    return () => logoLink.removeEventListener('click', onLogoClick)
  }, [])

  const openPrRequisitionDetailTab = (prId: string) => {
    setPrDetailRequisitionIds((prev) => (prev.includes(prId) ? prev : [...prev, prId]))
    setActiveTabId(prDetailTabId(prId))
  }

  const openProjectReportTab = (projectId: string) => {
    setProjectDetailIds((prev) => (prev.includes(projectId) ? prev : [...prev, projectId]))
    setActiveTabId(projectDetailTabId(projectId))
  }

  const closeClosableCommandCenterTab = (tabId: string) => {
    const poId = poIdFromDetailTabId(tabId)
    if (poId != null) {
      setPoDetailOrderIds((prev) => prev.filter((id) => id !== poId))
      setActiveTabId((current) => (current !== tabId ? current : 'requisitions'))
      return
    }
    const prId = prIdFromDetailTabId(tabId)
    if (prId != null) {
      setPrDetailRequisitionIds((prev) => prev.filter((id) => id !== prId))
      setActiveTabId((current) => (current !== tabId ? current : 'requisitions'))
      return
    }
    const projectId = projectIdFromDetailTabId(tabId)
    if (projectId != null) {
      setProjectDetailIds((prev) => prev.filter((id) => id !== projectId))
      setActiveTabId((current) => (current !== tabId ? current : 'requisitions'))
    }
  }

  useEffect(() => {
    if (activeTabId !== 'requisitions') {
      setSelectedRequisitionId(null)
      setSelectedProject(null)
    }
  }, [activeTabId])

  useEffect(() => {
    if (selectedRequisitionId == null && selectedProject == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetailPanel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedRequisitionId, selectedProject, closeDetailPanel])

  const commandCenterTabs = useMemo(() => {
    const base = REQ_MAIN_TAB_IDS.map((id) => ({
      id,
      label: 'Contracts Expiration Timeline',
      active: activeTabId === id,
      showClose: false as const,
    }))
    const prDetailTabs = prDetailRequisitionIds.map((prId) => {
      const id = prDetailTabId(prId)
      return {
        id,
        label: `Requisition Details : ${prId}`,
        active: activeTabId === id,
        showClose: true as const,
      }
    })
    const poDetailTabs = poDetailOrderIds.map((poId) => {
      const id = poDetailTabId(poId)
      return {
        id,
        label: `Order Details: ${poId}`,
        active: activeTabId === id,
        showClose: true as const,
      }
    })
    const projectDetailTabs = projectDetailIds.map((projectId) => {
      const id = projectDetailTabId(projectId)
      const found = findProjectAcrossContracts(projectId)
      return {
        id,
        label: found != null ? `${found.project.name} Report` : `Project Report: ${projectId}`,
        active: activeTabId === id,
        showClose: true as const,
      }
    })
    return [...base, ...prDetailTabs, ...poDetailTabs, ...projectDetailTabs]
  }, [activeTabId, prDetailRequisitionIds, poDetailOrderIds, projectDetailIds])

  const showTabContent = !blankCommandCenter

  const settingsTabs = useMemo<TabStripTab[]>(
    () =>
      SETTINGS_SHELL_TABS.map((tab) => ({
        ...tab,
        active: tab.id === settingsActiveTabId,
      })),
    [settingsActiveTabId],
  )

  const settingsWizardSteps = useMemo(() => {
    const activeIndex = SETTINGS_SHELL_TABS.findIndex((tab) => tab.id === settingsActiveTabId)
    return SETTINGS_WIZARD_STEPS.map((step, index) => {
      const completed = index < activeIndex
      return completed ? { label: step.label, completed: true } : step
    })
  }, [settingsActiveTabId])

  const settingsWizardIndex = Math.max(
    0,
    SETTINGS_SHELL_TABS.findIndex((tab) => tab.id === settingsActiveTabId),
  )
  const isFirstWizardStep = settingsWizardIndex === 0
  const isLastWizardStep = settingsWizardIndex >= SETTINGS_SHELL_TABS.length - 1

  const goToWizardStep = useCallback((stepIndex: number) => {
    const tab = SETTINGS_SHELL_TABS[stepIndex]
    if (tab == null) return
    setSettingsActiveTabId(tab.id)
  }, [])

  const updateRoleSetting = useCallback(
    (key: string, value: string | number | boolean) =>
      setRoleSettings((prev) => ({ ...prev, [key]: value })),
    [],
  )

  const organizationLevelField = (
    <RoleSettingField id="role-org-level" label="Default organizational rollup level">
      <Dropdown
        key={`org-${settingsActiveTabId}`}
        id="role-org-level"
        placeholder="-select-"
        options={ORG_LEVEL_OPTIONS}
        value={orgLevelByTab[settingsActiveTabId] ?? ''}
        onChange={(value) =>
          setOrgLevelByTab((prev) => ({ ...prev, [settingsActiveTabId]: value }))
        }
      />
    </RoleSettingField>
  )

  const settingsRoleContent = (() => {
    switch (settingsActiveTabId) {
      case 'accountant':
        return (
          <>
            {organizationLevelField}
            <RoleSettingField id="accountant-period-source" label="Reporting period source">
              <Dropdown
                id="accountant-period-source"
                options={REPORTING_PERIOD_OPTIONS}
                value={String(roleSettings.accountantPeriodSource)}
                onChange={(value) => updateRoleSetting('accountantPeriodSource', value)}
              />
            </RoleSettingField>
            <fieldset className="command-center-role-setting-group">
              <legend>Financial metric groups</legend>
              <Checkbox
                label="Revenue and billing"
                checked={Boolean(roleSettings.accountantRevenueMetrics)}
                onChange={(event) =>
                  updateRoleSetting('accountantRevenueMetrics', event.target.checked)
                }
              />
              <Checkbox
                label="Cost and margin"
                checked={Boolean(roleSettings.accountantCostMetrics)}
                onChange={(event) =>
                  updateRoleSetting('accountantCostMetrics', event.target.checked)
                }
              />
              <Checkbox
                label="Budget and EAC"
                checked={Boolean(roleSettings.accountantBudgetMetrics)}
                onChange={(event) =>
                  updateRoleSetting('accountantBudgetMetrics', event.target.checked)
                }
              />
              <Checkbox
                label="Cash and receivables"
                checked={Boolean(roleSettings.accountantCashMetrics)}
                onChange={(event) =>
                  updateRoleSetting('accountantCashMetrics', event.target.checked)
                }
              />
            </fieldset>
          </>
        )
      case 'ai-orchestrator':
        return (
          <>
            <RoleSettingField id="ai-scope" label="Default AI data scope">
              <Dropdown
                id="ai-scope"
                options={AI_SCOPE_OPTIONS}
                value={String(roleSettings.aiScope)}
                onChange={(value) => updateRoleSetting('aiScope', value)}
              />
            </RoleSettingField>
            <fieldset className="command-center-role-setting-group">
              <legend>AI assistance</legend>
              <Checkbox
                label="Generate financial summaries"
                checked={Boolean(roleSettings.aiSummaries)}
                onChange={(event) => updateRoleSetting('aiSummaries', event.target.checked)}
              />
              <Checkbox
                label="Recommend follow-up actions"
                checked={Boolean(roleSettings.aiRecommendations)}
                onChange={(event) => updateRoleSetting('aiRecommendations', event.target.checked)}
              />
              <Checkbox
                label="Send proactive insight notifications"
                checked={Boolean(roleSettings.aiNotifications)}
                onChange={(event) => updateRoleSetting('aiNotifications', event.target.checked)}
              />
            </fieldset>
          </>
        )
      case 'buyer':
        return (
          <>
            <fieldset className="command-center-role-setting-group">
              <legend>Procurement lifecycle stages</legend>
              {[
                ['buyerRequisition', 'Requisition'],
                ['buyerSolicitation', 'Solicitation'],
                ['buyerPurchaseOrder', 'Purchase order'],
                ['buyerReceipt', 'Receipt'],
                ['buyerInvoice', 'Invoice'],
              ].map(([key, label]) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={Boolean(roleSettings[key])}
                  onChange={(event) => updateRoleSetting(key, event.target.checked)}
                />
              ))}
            </fieldset>
            <RoleSettingField id="buyer-overdue-date" label="Overdue activity date">
              <Dropdown
                id="buyer-overdue-date"
                options={OVERDUE_DATE_OPTIONS}
                value={String(roleSettings.buyerOverdueDate)}
                onChange={(value) => updateRoleSetting('buyerOverdueDate', value)}
              />
            </RoleSettingField>
          </>
        )
      case 'contract-manager':
        return (
          <>
            {organizationLevelField}
            <RoleSettingField id="contract-warning" label="Funding warning threshold (%)">
              <NumberInput
                id="contract-warning"
                min={1}
                max={Number(roleSettings.contractCriticalThreshold) - 1}
                value={Number(roleSettings.contractWarningThreshold)}
                onChange={(value) => updateRoleSetting('contractWarningThreshold', value)}
              />
            </RoleSettingField>
            <RoleSettingField id="contract-critical" label="Funding critical threshold (%)">
              <NumberInput
                id="contract-critical"
                min={Number(roleSettings.contractWarningThreshold) + 1}
                max={100}
                value={Number(roleSettings.contractCriticalThreshold)}
                onChange={(value) => updateRoleSetting('contractCriticalThreshold', value)}
              />
            </RoleSettingField>
            <div className="command-center-role-setting-block">
              <Checkbox
                label="Flag contracts when a funding threshold is reached"
                checked={Boolean(roleSettings.contractAlerts)}
                onChange={(event) => updateRoleSetting('contractAlerts', event.target.checked)}
              />
            </div>
          </>
        )
      case 'project-analyst':
        return (
          <>
            {organizationLevelField}
            <RoleSettingField id="project-period" label="Default review period">
              <Dropdown
                id="project-period"
                options={PROJECT_PERIOD_OPTIONS}
                value={String(roleSettings.projectPeriod)}
                onChange={(value) => updateRoleSetting('projectPeriod', value)}
              />
            </RoleSettingField>
            <fieldset className="command-center-role-setting-group">
              <legend>Project insight groups</legend>
              {[
                ['projectBudgetMetrics', 'Budget and EAC'],
                ['projectScheduleMetrics', 'Schedule performance'],
                ['projectRiskMetrics', 'Risk and exceptions'],
              ].map(([key, label]) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={Boolean(roleSettings[key])}
                  onChange={(event) => updateRoleSetting(key, event.target.checked)}
                />
              ))}
            </fieldset>
          </>
        )
      case 'te-manager':
        return (
          <>
            {organizationLevelField}
            <RoleSettingField id="te-exception-date" label="Overdue submission date">
              <Dropdown
                id="te-exception-date"
                options={TIME_EXCEPTION_OPTIONS}
                value={String(roleSettings.teExceptionDate)}
                onChange={(value) => updateRoleSetting('teExceptionDate', value)}
              />
            </RoleSettingField>
            <fieldset className="command-center-role-setting-group">
              <legend>Time and expense exception groups</legend>
              {[
                ['teMissingTimesheets', 'Missing timesheets'],
                ['tePendingApprovals', 'Pending approvals'],
                ['teExpenseExceptions', 'Expense exceptions'],
              ].map(([key, label]) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={Boolean(roleSettings[key])}
                  onChange={(event) => updateRoleSetting(key, event.target.checked)}
                />
              ))}
            </fieldset>
          </>
        )
      default:
        return null
    }
  })()

  const settingsRolePanel = (
    <section className="command-center-settings-panel" aria-live="polite">
      <div className="command-center-role-settings-form">{settingsRoleContent}</div>
    </section>
  )


  /* On the Command Center screen the rail highlight moves to its own item. */
  const leftSidebarSections = useMemo(
    () =>
      blankCommandCenter
        ? COMMAND_CENTER_SIDEBAR_SECTIONS.map((section) => ({
            items: section.items.map((item) => ({
              ...item,
              active: item.label === COMMAND_CENTER_NAV_LABEL,
            })),
          }))
        : COMMAND_CENTER_SIDEBAR_SECTIONS,
    [blankCommandCenter],
  )

  return (
    <>
      <ShellLayout
        {...themeProps}
        className="command-center-shell"
        leftSidebarSections={leftSidebarSections}
        onLeftSidebarItemActivate={handleLeftSidebarItemActivate}
        pageHeaderTitle="Command Center"
        pageHeaderShowDefaultButtons={false}
        pageHeaderActions={
          <Dropdown
            id="settings-design-picker"
            className="command-center-design-picker"
            options={SETTINGS_DESIGN_OPTIONS}
            optionSlots={SETTINGS_DESIGN_OPTION_SLOTS}
            value={settingsDesign}
            onChange={setSettingsDesign}
          />
        }
      >
      <Card
        primary
        elevated
        className="command-center-home"
        withHeader={settingsShellOpen}
        headerTitle={settingsShellOpen ? 'Configure Settings' : undefined}
        headerActions={settingsShellOpen ? <PanelWindowControls /> : undefined}
      >
        <div className="card__body">
          {!blankCommandCenter && (
          <div className="command-center-tab-row">
            <TabStrip
              tabs={commandCenterTabs}
              onTabSelected={(id: string) => {
                if (
                  id === 'requisitions' ||
                  isPoDetailTabId(id) ||
                  isPrDetailTabId(id) ||
                  isProjectDetailTabId(id)
                ) {
                  setActiveTabId(id)
                }
              }}
              onCloseTab={closeClosableCommandCenterTab}
              overflowMode="none"
              className="tabstrip--command-center-tabs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon="arrow-path"
              ariaLabel="Refresh"
              className="command-center-tab-row__refresh"
              onClick={() => {
                setRefreshTick((t) => t + 1)
              }}
            />
          </div>
          )}

          {blankCommandCenter && !settingsShellOpen && (
            <div
              className="command-center-blank-canvas"
              role="region"
              aria-label="Command Center content"
            />
          )}

          {settingsShellOpen && (
            <div className="command-center-shell-body">
              <div
                className="command-center-shell-inner command-center-ai-settings"
                role="region"
                aria-label="Configure Settings content"
              >
                <Checkbox
                  id="enable-dela-ai"
                  label="Enable Dela AI assistance"
                  checked={delaAiEnabled}
                  onChange={(event) => setDelaAiEnabled(event.target.checked)}
                />
              </div>
            </div>
          )}

          {showTabContent && activeTabId === 'requisitions' && (
            <div className="command-center-requisitions-workspace">
              <div ref={kpiFilterZoneRef} className="command-center-kpi-filter-zone">
                <ContractsExpirationDashboard
                  key={refreshTick}
                  designOption={vizDesignOption}
                  chartIteration={dailyChartIteration}
                  tierCounts={expirationTierCounts}
                  tierContracts={expirationTierContracts}
                  tierExpiryLines={expirationTierExpiryLines}
                  highFundingCount={highFundingSummary.count}
                  highFundingLine={highFundingSummary.line}
                  fundingUtilization={fundingUtilization}
                  selectedTier={expirationTierFilter}
                  onSelectTier={handleSelectKpiTier}
                  onClearTier={() => setExpirationTierFilter(null)}
                  asOfDate={COMMAND_CENTER_AS_OF}
                />
              </div>
              <div className="lifecycle-bar-chart__table command-center-table-detail-anchor">
                <div
                  className="command-center-contracts-table-toolbar"
                  role="toolbar"
                  aria-label="Detail panel sections"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    buttonType="theme"
                    disabled={selectedRequisition == null}
                    className="command-center-contracts-table-toolbar__btn"
                    onClick={() => {
                      setReqPanelSummaryOpen(false)
                    }}
                  >
                    Collapse All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    buttonType="theme"
                    disabled={selectedRequisition == null}
                    className="command-center-contracts-table-toolbar__btn"
                    onClick={() => {
                      setReqPanelSummaryOpen(true)
                    }}
                  >
                    Expand All
                  </Button>
                </div>
                <div className="command-center-table-split">
                  <div className="command-center-table-detail-stack">
                    <div className="command-center-contracts-table-wrap">
                      <Table
                        headerVariant="white"
                        striped
                        className="command-center-data-table"
                        header={REQUISITION_TABLE_HEADER}
                        body={
                          <RequisitionTableBody
                            rows={sortedFilteredRequisitionRows}
                            selectedId={selectedRequisitionId}
                            selectedProject={selectedProject}
                            onSelectRow={selectContractRow}
                            onSelectProject={selectProjectRow}
                            expandedContractIds={expandedContractIds}
                            onToggleContractExpanded={toggleContractExpanded}
                          />
                        }
                      />
                    </div>
                  </div>
                  {selectedRequisition != null && (
                    <RequisitionSidePanel
                      row={selectedRequisition}
                      onClose={closeDetailPanel}
                      onOpenRequisitionReportTab={openPrRequisitionDetailTab}
                      summaryAccordionOpen={reqPanelSummaryOpen}
                      onSummaryAccordionOpenChange={setReqPanelSummaryOpen}
                    />
                  )}
                  {selectedProjectContext != null && (
                    <ProjectSidePanel
                      project={selectedProjectContext.project}
                      contract={selectedProjectContext.contract}
                      onClose={closeDetailPanel}
                      onOpenProjectReportTab={openProjectReportTab}
                      summaryAccordionOpen={projectPanelSummaryOpen}
                      onSummaryAccordionOpenChange={setProjectPanelSummaryOpen}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {showTabContent && isPrDetailTabId(activeTabId) && (
            <div className="command-center-order-detail-wrap" key={activeTabId}>
              <RequisitionDetailsTabView prId={prIdFromDetailTabId(activeTabId) ?? ''} />
            </div>
          )}

          {showTabContent && isProjectDetailTabId(activeTabId) && (
            <div className="command-center-order-detail-wrap" key={activeTabId}>
              <ProjectReportTabView projectId={projectIdFromDetailTabId(activeTabId) ?? ''} />
            </div>
          )}

          {showTabContent && isPoDetailTabId(activeTabId) && (
            <div className="command-center-order-detail-wrap" key={activeTabId}>
              <PoOrderDetailView poId={poIdFromDetailTabId(activeTabId) ?? 'PO-1039'} />
            </div>
          )}
        </div>
      </Card>

      {settingsShellOpen && (
        <div className="command-center-settings-stack">
          <Card
            primary
            elevated
            className="command-center-home command-center-settings-shell"
            withHeader
            headerTitle="Role Based Setup"
            headerActions={<PanelWindowControls />}
          >
            <div className="card__body">
              {settingsDesign === 'design-1' ? (
                <div className="command-center-shell-body">
                  <div
                    className="command-center-shell-inner"
                    role="region"
                    aria-label="Role Based Setup content"
                  >
                    <TabStrip
                      tabs={settingsTabs}
                      onTabSelected={setSettingsActiveTabId}
                      overflowMode="none"
                      className="tabstrip--command-center-tabs command-center-settings-tabs"
                    />
                    {settingsRolePanel}
                  </div>
                </div>
              ) : (
                /* Design 2 has no inset well: the wizard and its field sit directly
                 * on the settings shell. */
                <div
                  className="command-center-settings-flat"
                  role="region"
                  aria-label="Role Based Setup content"
                >
                  <Stepper
                    nonLinear
                    activeStep={settingsWizardIndex}
                    steps={settingsWizardSteps}
                    onStepClick={goToWizardStep}
                    className="command-center-settings-wizard"
                  />
                  {settingsRolePanel}
                </div>
              )}
            </div>
          </Card>
          {settingsDesign === 'design-2' && (
            <div
              className="command-center-settings-actions"
              role="group"
              aria-label="Wizard navigation"
            >
              <Button
                type="button"
                buttonType="theme"
                variant="outline"
                disabled={isFirstWizardStep}
                onClick={() => goToWizardStep(settingsWizardIndex - 1)}
              >
                Back
              </Button>
              <Button
                type="button"
                buttonType="theme"
                variant="primary"
                disabled={isLastWizardStep}
                onClick={() => goToWizardStep(settingsWizardIndex + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
      </ShellLayout>
      {navPanelOpen && (
        <LeftNavPanel
          onItemSelect={() => {
            setNavPanelOpen(false)
            setSettingsActiveTabId(SETTINGS_SHELL_TABS[0].id)
            setSettingsDesign('design-1')
            setSettingsShellOpen(true)
          }}
        />
      )}
      <Dialog
        id="command-center-interaction-rules"
        title="Interaction rules"
        open={interactionRulesOpen}
        onClose={() => setInteractionRulesOpen(false)}
        resizable={false}
        footer={
          <div className="dialog__footer-actions">
            <Button
              buttonType="theme"
              variant="primary"
              onClick={() => setInteractionRulesOpen(false)}
            >
              Close
            </Button>
          </div>
        }
      >
        <InteractionRulesPanel />
      </Dialog>
    </>
  )
}

function shortBuildStampLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso)
  if (!m) return iso.slice(0, 14)
  return `${m[2]}-${m[3]} ${m[4]}:${m[5]}`
}

/** Tiny on-screen + console proof of which bundle loaded (`vite.config` `__APP_BUILD_ID__`). */
function AppBuildStamp() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.info('[Costpoint Command Center] bundle', {
      buildId: __APP_BUILD_ID__,
      mode: import.meta.env.MODE,
    })
  }, [])

  const modeTag = import.meta.env.DEV ? 'dev' : 'prod'
  const short = shortBuildStampLabel(__APP_BUILD_ID__)

  const el = (
    <div
      className="app-build-stamp"
      data-app-build-stamp
      title={`Build: ${__APP_BUILD_ID__}\nMODE: ${import.meta.env.MODE}`}
      aria-label={`Application bundle ${modeTag} ${short}`}
    >
      <span className="app-build-stamp__mode">{modeTag}</span>
      <span className="app-build-stamp__sep" aria-hidden>
        ·
      </span>
      <span className="app-build-stamp__time">{short}</span>
    </div>
  )

  if (!mounted || typeof document === 'undefined') return null
  return createPortal(el, document.body)
}

function App() {
  useEffect(() => {
    document.documentElement.classList.remove(
      'theme-cp',
      'theme-ppm',
      'theme-vp',
      'theme-maconomy',
    )
    document.documentElement.classList.add(DEFAULT_THEME)
    document.documentElement.classList.remove('dark')
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<HomeShell />} />
        <Route path="/components" element={<ComponentGalleryPage />} />
        <Route path="/components/:componentName" element={<ComponentDemoPage />} />
        <Route path="/demos/right-sidebar-panels" element={<RightSidebarPanelDemosPage />} />
      </Routes>
      <AppBuildStamp />
    </>
  )
}

export default App

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Icon } from './Icon'
import './LeftNavPanel.css'

export interface LeftNavPanelItem {
  label: string
  /** Renders the +/- expander affordance on the trailing edge. */
  expandable?: boolean
  /** Leaf that is shown in the tree but cannot be activated. Defaults to true. */
  interactive?: boolean
  children?: LeftNavPanelItem[]
}

export interface LeftNavPanelProps {
  title?: string
  items?: LeftNavPanelItem[]
  defaultExpanded?: string[]
  defaultSelected?: string
  onItemSelect?: (item: LeftNavPanelItem) => void
}

const DEFAULT_ITEMS: LeftNavPanelItem[] = [{ label: 'Configure Command Center Settings' }]

function itemIsBranch(item: LeftNavPanelItem) {
  return item.expandable === true || (item.children != null && item.children.length > 0)
}

function NavTree({
  items,
  depth,
  expanded,
  selected,
  onToggle,
  onSelect,
}: {
  items: LeftNavPanelItem[]
  depth: number
  expanded: Set<string>
  selected: string | null
  onToggle: (label: string) => void
  onSelect: (item: LeftNavPanelItem) => void
}) {
  return (
    <ul
      className={clsx('left-nav-panel__list', depth > 0 && 'left-nav-panel__list--nested')}
      role={depth === 0 ? undefined : 'group'}
    >
      {items.map((item) => {
        const isBranch = itemIsBranch(item)
        const isOpen = isBranch && expanded.has(item.label)
        const isInteractive = item.interactive !== false
        const isSelected = !isBranch && selected === item.label
        const nested = isOpen ? (item.children ?? []) : []
        const itemClassName = clsx(
          'left-nav-panel__item',
          isOpen && 'is-expanded',
          isSelected && 'is-selected',
          !isBranch && !isInteractive && 'is-static',
        )
        const itemContent = (
          <>
            <span className="left-nav-panel__label">{item.label}</span>
            {isSelected && (
              <Icon name="star" size="sm" className="left-nav-panel__favorite" aria-hidden />
            )}
            {isBranch && (
              <Icon
                name={isOpen ? 'minus' : 'plus'}
                size="sm"
                className="left-nav-panel__expander"
                aria-hidden
              />
            )}
          </>
        )

        return (
          <li
            key={item.label}
            className={clsx(
              'left-nav-panel__row',
              isOpen && 'is-expanded',
              isSelected && 'is-selected',
            )}
          >
            {isBranch || isInteractive ? (
              <button
                type="button"
                className={itemClassName}
                aria-expanded={isBranch ? isOpen : undefined}
                aria-current={isSelected ? 'page' : undefined}
                onClick={() => (isBranch ? onToggle(item.label) : onSelect(item))}
              >
                {itemContent}
              </button>
            ) : (
              <div
                className={itemClassName}
                aria-current={isSelected ? 'page' : undefined}
              >
                {itemContent}
              </div>
            )}
            {nested.length > 0 && (
              <NavTree
                items={nested}
                depth={depth + 1}
                expanded={expanded}
                selected={selected}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Expanded navigation flyout that sits beside the left rail and floats over
 * the page content. Locks the rail at its collapsed width so it cannot
 * hover-expand underneath this panel.
 *
 * `data-rail-locked` rather than `data-panel-open`: the latter also flattens
 * the rail's section cards for panels that sit flush against the rail, and
 * this flyout sits alongside them.
 */
export function LeftNavPanel({
  title = 'Command Center',
  items = DEFAULT_ITEMS,
  defaultExpanded = [],
  defaultSelected,
  onItemSelect,
}: LeftNavPanelProps) {
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded))
  const [selected, setSelected] = useState<string | null>(defaultSelected ?? null)

  useEffect(() => {
    const rail = document.querySelector<HTMLElement>('.shell-layout__left-sidebar')
    if (rail == null) return
    rail.setAttribute('data-rail-locked', 'true')
    return () => rail.removeAttribute('data-rail-locked')
  }, [])

  useEffect(() => {
    setExpanded(new Set(defaultExpanded))
    setSelected(defaultSelected ?? null)
    /* Reset tree chrome when the flyout switches modules, not on every parent render. */
  }, [title])

  const handleToggle = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const handleSelect = (item: LeftNavPanelItem) => {
    setSelected(item.label)
    onItemSelect?.(item)
  }

  const isTree = items.some(itemIsBranch)

  return (
    <nav
      className={clsx('left-nav-panel', isTree && 'left-nav-panel--tree')}
      aria-label={`${title} menu`}
    >
      <h2 className="left-nav-panel__title">{title}</h2>
      <NavTree
        items={items}
        depth={0}
        expanded={expanded}
        selected={selected}
        onToggle={handleToggle}
        onSelect={handleSelect}
      />
    </nav>
  )
}

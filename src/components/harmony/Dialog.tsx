import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Icon } from './Icon'
import { Button } from './Button'
import './Dialog.css'

export interface DialogProps {
  id: string
  title: string
  open?: boolean
  onClose?: () => void
  className?: string
  buttonAlignment?: 'left' | 'right'
  headerVariant?: 'default' | 'primary'
  /** When true, shows a resize grip in the bottom-right corner; users can drag to resize the dialog. */
  resizable?: boolean
  /** When using the default footer, optional label for a third (tertiary/link-style) button. Ignored when footer is provided. */
  tertiaryLabel?: string
  /** When the tertiary button is clicked, called before onClose. Ignored when footer is provided. */
  onTertiaryClick?: () => void
  /** Controls rendered in the header, left of the close button (e.g. a query menu, window controls). */
  headerActions?: ReactNode
  children?: ReactNode
  footer?: ReactNode
}

export function Dialog({
  id,
  title,
  open = false,
  onClose,
  className = '',
  buttonAlignment = 'left',
  headerVariant = 'default',
  resizable = true,
  tertiaryLabel,
  onTertiaryClick,
  headerActions,
  children,
  footer,
}: DialogProps) {
  const overlayId = `${id}-overlay`
  const titleId = `${id}-title`
  const dialogRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  useEffect(() => {
    if (!resizable || !dialogRef.current) return
    const dialog = dialogRef.current
    const grip = dialog.querySelector('[data-dialog-resize-grip]') as HTMLElement | null
    if (!grip) return

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      const rect = dialog.getBoundingClientRect()
      const startW = rect.width
      const startH = rect.height
      dialog.style.width = `${startW}px`
      dialog.style.height = `${startH}px`
      dialog.style.minWidth = '0'
      dialog.style.maxWidth = 'none'
      dialog.style.maxHeight = 'none'
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startW,
        startH,
      }
      const onMove = (moveEvent: MouseEvent) => {
        if (!dragRef.current) return
        const { startX, startY, startW, startH } = dragRef.current
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY
        const w = Math.max(1, Math.round(startW + dx))
        const h = Math.max(1, Math.round(startH + dy))
        dialog.style.width = `${w}px`
        dialog.style.height = `${h}px`
      }
      const onUp = () => {
        dragRef.current = null
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.userSelect = ''
      }
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }
    grip.addEventListener('mousedown', onMouseDown)
    return () => grip.removeEventListener('mousedown', onMouseDown)
  }, [resizable, open])

  return (
    <div
      id={overlayId}
      className={clsx('dialog-overlay', open && 'is-open')}
      data-dialog-overlay
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className={clsx('dialog', resizable && 'dialog--resizable', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={clsx(
            'dialog__header',
            `dialog__header--variant-${headerVariant}`
          )}
        >
          <h2 className="dialog__title" id={titleId}>
            {title}
          </h2>
          <div className="dialog__header-actions">
            {headerActions}
            <button
              type="button"
              className="dialog__close"
              data-dialog-close
              aria-label="Close"
              onClick={onClose}
            >
              <Icon name="x-mark" />
            </button>
          </div>
        </div>
        <div className="dialog__body">
          {children ?? (
            <p className="dialog__body-default">
              Dialog content. Override by passing default slot content.
            </p>
          )}
        </div>
        <div
          className={clsx(
            'dialog__footer',
            `dialog__footer--align-${buttonAlignment}`
          )}
        >
          {footer ?? (
            <div className="dialog__footer-actions">
              <Button buttonType="theme" variant="primary" onClick={onClose}>
                Confirm
              </Button>
              <Button buttonType="theme" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              {tertiaryLabel && (
                <Button
                  buttonType="theme"
                  variant="tertiary"
                  onClick={() => {
                    onTertiaryClick?.()
                    onClose?.()
                  }}
                >
                  {tertiaryLabel}
                </Button>
              )}
            </div>
          )}
        </div>
        {resizable && (
          <div
            className="dialog__resize-grip"
            data-dialog-resize-grip
            role="img"
            aria-label="Resize"
          >
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" aria-hidden>
              <line x1={12} y1={15} x2={15} y2={12} />
              <line x1={8} y1={15} x2={15} y2={8} />
              <line x1={4} y1={15} x2={15} y2={4} />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

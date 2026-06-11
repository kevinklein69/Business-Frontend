'use client'

import { ListChecks, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OrderPositionInput } from '@/types'

export interface PositionRow {
  description: string
  quantity: string
  unitPrice: string
}

export const emptyPositionRow: PositionRow = { description: '', quantity: '', unitPrice: '' }

export function isPositionRowEmpty(row: PositionRow) {
  return !row.description.trim() && !row.quantity.trim() && !row.unitPrice.trim()
}

export function positionRowErrors(row: PositionRow) {
  return {
    description: row.description.trim() ? null : 'Die Leistung ist erforderlich.',
    quantity: row.quantity.trim() && Number(row.quantity) > 0 ? null : 'Die Menge muss größer als 0 sein.',
    unitPrice: row.unitPrice.trim() && Number(row.unitPrice) >= 0 ? null : 'Der Einzelpreis darf nicht negativ sein.',
  }
}

export function isPositionRowValid(row: PositionRow) {
  const errors = positionRowErrors(row)
  return !errors.description && !errors.quantity && !errors.unitPrice
}

export function toPositionInputs(rows: PositionRow[]): OrderPositionInput[] {
  return rows
    .filter((row) => !isPositionRowEmpty(row))
    .map((row) => ({
      description: row.description.trim(),
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
    }))
}

const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

function rowTotal(row: PositionRow) {
  const quantity = Number(row.quantity)
  const unitPrice = Number(row.unitPrice)
  if (!row.quantity.trim() || !row.unitPrice.trim() || Number.isNaN(quantity) || Number.isNaN(unitPrice)) return null
  return quantity * unitPrice
}

export function OrderPositionsEditor({
  positions,
  onChange,
  showErrors = false,
}: {
  positions: PositionRow[]
  onChange: (positions: PositionRow[]) => void
  showErrors?: boolean
}) {
  const updateRow = (index: number, patch: Partial<PositionRow>) =>
    onChange(positions.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const removeRow = (index: number) => onChange(positions.filter((_, i) => i !== index))

  const addRow = () => onChange([...positions, { ...emptyPositionRow }])

  const total = positions.reduce((sum, row) => sum + (rowTotal(row) ?? 0), 0)
  const hasAnyRow = positions.some((row) => !isPositionRowEmpty(row))

  return (
    <div className="flex flex-col gap-2">
      <Label className="flex items-center gap-1.5">
        <ListChecks className="size-3.5" /> Positionen
      </Label>

      {positions.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_70px_90px_80px_28px] gap-1.5 px-0.5 text-xs text-muted-foreground">
            <span>Leistung</span>
            <span>Menge</span>
            <span>Einzelpreis</span>
            <span className="text-right">Gesamt</span>
            <span />
          </div>
          {positions.map((row, index) => {
            const errors = positionRowErrors(row)
            const showRowErrors = showErrors && !isPositionRowEmpty(row)
            const total = rowTotal(row)
            return (
              <div key={index} className="flex flex-col gap-1">
                <div className="grid grid-cols-[1fr_70px_90px_80px_28px] gap-1.5 items-center">
                  <Input
                    aria-label={`Leistung Position ${index + 1}`}
                    value={row.description}
                    onChange={(e) => updateRow(index, { description: e.target.value })}
                    placeholder="z.B. Trockenbau"
                  />
                  <Input
                    aria-label={`Menge Position ${index + 1}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, { quantity: e.target.value })}
                    placeholder="1"
                  />
                  <Input
                    aria-label={`Einzelpreis Position ${index + 1}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.unitPrice}
                    onChange={(e) => updateRow(index, { unitPrice: e.target.value })}
                    placeholder="0,00"
                  />
                  <span className="text-sm text-right tabular-nums truncate">
                    {total != null ? currencyFormatter.format(total) : '–'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Position ${index + 1} entfernen`}
                    onClick={() => removeRow(index)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
                {showRowErrors && (errors.description || errors.quantity || errors.unitPrice) && (
                  <p className="text-xs text-destructive">
                    {[errors.description, errors.quantity, errors.unitPrice].filter(Boolean).join(' ')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="size-3.5" /> Position hinzufügen
        </Button>
        {hasAnyRow && (
          <span className="text-sm font-medium tabular-nums">
            Gesamtsumme: {currencyFormatter.format(total)}
          </span>
        )}
      </div>
    </div>
  )
}

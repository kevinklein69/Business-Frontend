'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Building2, CalendarRange, Plus } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateOrder, useUploadOrderAttachments } from '@/hooks/use-orders'
import { AssigneePicker } from './assignee-picker'
import { FileUploadZone } from './file-upload-zone'
import {
  OrderPositionsEditor, isPositionRowEmpty, isPositionRowValid, toPositionInputs,
  type PositionRow,
} from './order-positions-editor'
import type { Assignee, Employee, Order } from '@/types'

function serverErrorMessage(err: unknown) {
  if (isAxiosError(err) && err.response?.status === 400) {
    const errors = err.response.data?.errors as Record<string, string[]> | undefined
    if (errors) return Object.values(errors).flat().join(' ')
    return 'Die Eingaben sind ungültig.'
  }
  return 'Der Auftrag konnte nicht erstellt werden.'
}

export function CreateOrderDialog({ employees }: { employees: Employee[] }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [customer, setCustomer] = useState('')
  const [description, setDescription] = useState('')
  const [plannedStartDate, setPlannedStartDate] = useState('')
  const [plannedEndDate, setPlannedEndDate] = useState('')
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [positions, setPositions] = useState<PositionRow[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)
  const [uploadFailed, setUploadFailed] = useState(false)

  const createOrder = useCreateOrder()
  const uploadAttachments = useUploadOrderAttachments()
  const isPending = createOrder.isPending || uploadAttachments.isPending

  const reset = () => {
    setTitle(''); setCustomer(''); setDescription('')
    setPlannedStartDate(''); setPlannedEndDate('')
    setAssignees([]); setPositions([]); setFiles([])
    setTouched({}); setSubmitAttempted(false)
    setError(null); setCreatedOrder(null); setUploadFailed(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && isPending) return
    setOpen(next)
    if (!next) reset()
  }

  const markTouched = (field: string) => () => setTouched((t) => ({ ...t, [field]: true }))
  const showError = (field: string) => touched[field] || submitAttempted

  const fieldErrors = {
    title: title.trim() ? null : 'Der Titel ist erforderlich.',
    customer: customer.trim() ? null : 'Der Kunde ist erforderlich.',
    plannedStartDate: plannedStartDate ? null : 'Das Startdatum ist erforderlich.',
    plannedEndDate: !plannedEndDate
      ? 'Das Enddatum ist erforderlich.'
      : plannedStartDate && plannedEndDate < plannedStartDate
        ? 'Das Enddatum darf nicht vor dem Startdatum liegen.'
        : null,
    assignees: assignees.length > 0 ? null : 'Mindestens ein Mitarbeiter muss zugewiesen werden.',
  }

  const positionsValid = positions.every((row) => isPositionRowEmpty(row) || isPositionRowValid(row))
  const canSubmit = !Object.values(fieldErrors).some(Boolean) && positionsValid

  const handleCreate = async () => {
    setSubmitAttempted(true)
    setError(null)
    if (!canSubmit) return

    try {
      const order = await createOrder.mutateAsync({
        title: title.trim(),
        customer: customer.trim(),
        description: description.trim() || undefined,
        plannedStartDate,
        plannedEndDate,
        assigneeIds: assignees.map((a) => a.id),
        positions: toPositionInputs(positions),
      })

      if (files.length > 0) {
        setCreatedOrder(order)
        try {
          await uploadAttachments.mutateAsync({ orderId: order.id, files })
        } catch {
          setUploadFailed(true)
          return
        }
      }

      handleOpenChange(false)
    } catch (err) {
      setError(serverErrorMessage(err))
    }
  }

  const handleRetryUpload = async () => {
    if (!createdOrder) return
    try {
      await uploadAttachments.mutateAsync({ orderId: createdOrder.id, files })
      setOpen(false)
      reset()
    } catch {
      setUploadFailed(true)
    }
  }

  const attachmentFailureMode = createdOrder !== null && uploadFailed

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Neuer Auftrag
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Neuen Auftrag erstellen</DialogTitle></DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Titel */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="n-title">Titel *</Label>
            <Input
              id="n-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={markTouched('title')}
              placeholder="Auftragstitel"
              disabled={attachmentFailureMode}
              aria-invalid={showError('title') && !!fieldErrors.title}
            />
            {showError('title') && fieldErrors.title && (
              <p className="text-sm text-destructive">{fieldErrors.title}</p>
            )}
          </div>

          {/* Kunde */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="n-customer" className="flex items-center gap-1.5">
              <Building2 className="size-3.5" /> Kunde *
            </Label>
            <Input
              id="n-customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              onBlur={markTouched('customer')}
              placeholder="Kundenname"
              disabled={attachmentFailureMode}
              aria-invalid={showError('customer') && !!fieldErrors.customer}
            />
            {showError('customer') && fieldErrors.customer && (
              <p className="text-sm text-destructive">{fieldErrors.customer}</p>
            )}
          </div>

          {/* Beschreibung */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="n-description">Beschreibung (optional)</Label>
            <textarea
              id="n-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Auftragsdetails…"
              rows={3}
              disabled={attachmentFailureMode}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground disabled:opacity-50"
            />
          </div>

          {/* Ausführungszeitraum */}
          <div className="flex flex-col gap-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CalendarRange className="size-3.5" /> Ausführungszeitraum
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="n-planned-start">Geplanter Start *</Label>
                <Input
                  id="n-planned-start"
                  type="date"
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                  onBlur={markTouched('plannedStartDate')}
                  disabled={attachmentFailureMode}
                  aria-invalid={showError('plannedStartDate') && !!fieldErrors.plannedStartDate}
                />
                {showError('plannedStartDate') && fieldErrors.plannedStartDate && (
                  <p className="text-sm text-destructive">{fieldErrors.plannedStartDate}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="n-planned-end">Geplantes Ende *</Label>
                <Input
                  id="n-planned-end"
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  onBlur={markTouched('plannedEndDate')}
                  disabled={attachmentFailureMode}
                  aria-invalid={showError('plannedEndDate') && !!fieldErrors.plannedEndDate}
                />
                {showError('plannedEndDate') && fieldErrors.plannedEndDate && (
                  <p className="text-sm text-destructive">{fieldErrors.plannedEndDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Zuweisung */}
          {!attachmentFailureMode && (
            <div className="border-t pt-3">
              <AssigneePicker
                employees={employees}
                assignees={assignees}
                onChange={setAssignees}
                label="Zuweisung"
                required
                error={showError('assignees') || submitAttempted ? fieldErrors.assignees : null}
              />
            </div>
          )}

          {/* Positionen */}
          {!attachmentFailureMode && (
            <div className="border-t pt-3">
              <OrderPositionsEditor
                positions={positions}
                onChange={setPositions}
                showErrors={submitAttempted}
              />
            </div>
          )}

          {/* Anhänge */}
          <div className="border-t pt-3">
            <FileUploadZone files={files} onChange={setFiles} />
          </div>

          {attachmentFailureMode && (
            <div className="flex flex-col gap-1 rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2">
              <p className="text-sm">Der Auftrag <strong>{createdOrder?.title}</strong> wurde erstellt.</p>
              <p className="text-sm text-destructive">
                Die Anhänge konnten jedoch nicht hochgeladen werden. Bitte erneut versuchen oder ohne Anhänge schließen.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          {attachmentFailureMode ? (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                Ohne Anhänge schließen
              </Button>
              <Button onClick={handleRetryUpload} disabled={isPending || files.length === 0}>
                Erneut hochladen
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                Erstellen
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

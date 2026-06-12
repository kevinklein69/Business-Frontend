'use client'

import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSignOrderAcceptance } from '@/hooks/use-orders'
import { SignaturePad, type SignaturePadHandle } from './signature-pad'
import type { Order } from '@/types'

function serverErrorMessage(err: unknown) {
  if (isAxiosError(err)) {
    if (err.response?.status === 400) {
      const errors = err.response.data?.errors as Record<string, string[]> | undefined
      if (errors) return Object.values(errors).flat().join(' ')
    }
    const detail = err.response?.data?.detail as string | undefined
    if (detail) return detail
  }
  return 'Die Abnahme konnte nicht gespeichert werden.'
}

export function AcceptanceDialog({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const [signerName, setSignerName] = useState('')
  const [signatureEmpty, setSignatureEmpty] = useState(true)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const signaturePadRef = useRef<SignaturePadHandle>(null)
  const signAcceptance = useSignOrderAcceptance()

  const reset = () => {
    setSignerName('')
    setSignatureEmpty(true)
    setSubmitAttempted(false)
    signaturePadRef.current?.clear()
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && signAcceptance.isPending) return
    if (!next) {
      onClose()
      reset()
    }
  }

  const nameError = signerName.trim() ? null : 'Der Name des Unterzeichners ist erforderlich.'
  const signatureError = signatureEmpty ? 'Die Unterschrift darf nicht leer sein.' : null

  const handleConfirm = async () => {
    setSubmitAttempted(true)
    if (nameError || signatureError) return

    try {
      await signAcceptance.mutateAsync({
        id: order.id,
        signerName: signerName.trim(),
        signatureImageBase64: signaturePadRef.current?.toDataUrl() ?? '',
      })
      toast.success('Kundenabnahme gespeichert', {
        description: 'Das Abnahmeprotokoll wurde als PDF erzeugt und am Auftrag hinterlegt.',
      })
      onClose()
      reset()
    } catch (err) {
      toast.error('Abnahme konnte nicht gespeichert werden', { description: serverErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kundenabnahme durchführen</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="acc-signer-name">Name des Unterzeichners *</Label>
            <Input
              id="acc-signer-name"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Vor- und Nachname"
              disabled={signAcceptance.isPending}
              required
              aria-invalid={submitAttempted && !!nameError}
            />
            {submitAttempted && nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Datum/Uhrzeit</Label>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'dd.MM.yyyy HH:mm')} Uhr (wird automatisch gesetzt)
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Unterschrift *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => signaturePadRef.current?.clear()}
                disabled={signAcceptance.isPending}
              >
                Löschen
              </Button>
            </div>
            <SignaturePad ref={signaturePadRef} onChange={(empty) => setSignatureEmpty(empty)} />
            {submitAttempted && signatureError && <p className="text-sm text-destructive">{signatureError}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={signAcceptance.isPending}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm} disabled={signAcceptance.isPending}>
            Abnahme bestätigen & PDF generieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

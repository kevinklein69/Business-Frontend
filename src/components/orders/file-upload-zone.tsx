'use client'

import { useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Paperclip, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileIcon(nameOrType: string) {
  return /\.(jpe?g|png)$/i.test(nameOrType) || nameOrType.startsWith('image/')
    ? ImageIcon
    : FileText
}

export function FileUploadZone({
  files,
  onChange,
  label = 'Anhänge',
}: {
  files: File[]
  onChange: (files: File[]) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [rejection, setRejection] = useState<string | null>(null)

  const addFiles = (incoming: FileList | File[]) => {
    const accepted: File[] = []
    const rejected: string[] = []

    for (const file of Array.from(incoming)) {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        rejected.push(`${file.name}: Nicht erlaubter Dateityp. Erlaubt sind JPG, PNG, PDF, DOCX, XLSX.`)
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        rejected.push(`${file.name}: Die Datei ist größer als 10 MB.`)
      } else if (!files.some((f) => f.name === file.name && f.size === file.size)) {
        accepted.push(file)
      }
    }

    setRejection(rejected.length > 0 ? rejected.join(' ') : null)
    if (accepted.length > 0) onChange([...files, ...accepted])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    addFiles(e.dataTransfer.files)
  }

  const removeFile = (index: number) => onChange(files.filter((_, i) => i !== index))

  return (
    <div className="flex flex-col gap-2">
      <Label className="flex items-center gap-1.5">
        <Paperclip className="size-3.5" /> {label}
      </Label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        className={cn(
          'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors',
          dragActive
            ? 'border-primary bg-primary/10'
            : 'border-border bg-muted/50 hover:border-primary/50 hover:bg-muted'
        )}
      >
        <Upload className={cn('size-5', dragActive ? 'text-primary' : 'text-muted-foreground')} />
        <p className="text-sm text-muted-foreground">
          Dateien hierher ziehen oder <span className="text-primary font-medium">auswählen</span>
        </p>
        <p className="text-xs text-muted-foreground">JPG, PNG, PDF, DOCX, XLSX · max. 10 MB pro Datei</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {rejection && <p className="text-sm text-destructive">{rejection}</p>}

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => {
            const Icon = fileIcon(file.name)
            return (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm"
              >
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  aria-label={`${file.name} entfernen`}
                  onClick={() => removeFile(index)}
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

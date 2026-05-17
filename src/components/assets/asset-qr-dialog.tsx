'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { generateAssetQrCode } from '@/actions/assets'
import { QrCode, Download, RefreshCw } from 'lucide-react'

type Props = {
  assetId: string
  assetName: string
  qrCode: string | null
  children: React.ReactElement
}

export function AssetQrDialog({ assetId, assetName, qrCode: initialQrCode, children }: Props) {
  const [open, setOpen] = useState(false)
  const [qrCode, setQrCode] = useState(initialQrCode)
  const [pending, startTransition] = useTransition()

  const trigger = React.cloneElement(
    children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    { onClick: () => setOpen(true) }
  )

  function handleGenerate() {
    startTransition(async () => {
      try {
        const code = await generateAssetQrCode(assetId)
        setQrCode(code)
        toast.success('QR code généré')
      } catch {
        toast.error('Erreur lors de la génération')
      }
    })
  }

  function handleDownload() {
    if (!qrCode) return
    const url = `/api/qr/${qrCode}`
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${assetName.toLowerCase().replace(/\s+/g, '-')}.svg`
    a.click()
  }

  function handlePrint() {
    if (!qrCode) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR — ${assetName}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
            img { width: 200px; height: 200px; }
            p { margin-top: 12px; font-size: 14px; font-weight: 600; }
          </style>
        </head>
        <body>
          <img src="/api/qr/${qrCode}" />
          <p>${assetName}</p>
          <script>window.onload = () => { window.print(); window.close() }<\/script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Code — {assetName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {qrCode ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/qr/${qrCode}`}
                  alt={`QR code pour ${assetName}`}
                  className="w-48 h-48 border rounded-lg p-1"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Scannez pour accéder à la fiche de l&apos;actif
                </p>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Télécharger
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={handlePrint}>
                    Imprimer
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={handleGenerate}
                    disabled={pending}
                    title="Régénérer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-48 h-48 border rounded-lg flex items-center justify-center bg-muted/30">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Aucun QR code généré pour cet actif.
                </p>
                <Button onClick={handleGenerate} disabled={pending} className="w-full">
                  {pending ? 'Génération...' : 'Générer le QR code'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

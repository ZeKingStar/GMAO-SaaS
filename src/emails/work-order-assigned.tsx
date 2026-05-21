import React from 'react'

interface Props {
  recipientName: string
  workOrderNumber: number
  workOrderTitle: string
  workOrderPriority: string
  dueDate?: Date | null
  organizationName: string
}

const PRIORITY_FR: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  urgent: 'Urgente',
}

export function WorkOrderAssignedEmail({
  recipientName,
  workOrderNumber,
  workOrderTitle,
  workOrderPriority,
  dueDate,
  organizationName,
}: Props) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', margin: 0, padding: 0 }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f9fafb' }}>
          <tr>
            <td align="center" style={{ padding: '32px 16px' }}>
              <table width="600" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {/* Header */}
                <tr>
                  <td style={{ backgroundColor: '#E8830C', padding: '24px 32px' }}>
                    <span style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>Korvia</span>
                  </td>
                </tr>
                {/* Body */}
                <tr>
                  <td style={{ padding: '32px', color: '#1a1a1a' }}>
                    <p style={{ margin: '0 0 16px', fontSize: '16px' }}>Bonjour {recipientName},</p>
                    <p style={{ margin: '0 0 24px', fontSize: '16px' }}>
                      Un bon de travail vous a été assigné dans <strong>{organizationName}</strong>.
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', marginBottom: '24px' }}>
                      <tr>
                        <td style={{ padding: '20px 24px' }}>
                          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bon de travail</p>
                          <p style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a' }}>#{workOrderNumber} — {workOrderTitle}</p>
                          <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#374151' }}>
                            <strong>Priorité :</strong> {PRIORITY_FR[workOrderPriority] ?? workOrderPriority}
                          </p>
                          {dueDate && (
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#374151' }}>
                              <strong>Échéance :</strong> {dueDate.toLocaleDateString('fr-CA', { dateStyle: 'long' })}
                            </p>
                          )}
                        </td>
                      </tr>
                    </table>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                      Connectez-vous à Korvia pour consulter les détails et mettre à jour le statut du bon.
                    </p>
                  </td>
                </tr>
                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#f9fafb', padding: '16px 32px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                      Korvia — Gestion de maintenance assistée par ordinateur<br />
                      Cet email a été envoyé automatiquement. Ne pas répondre à ce message.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}

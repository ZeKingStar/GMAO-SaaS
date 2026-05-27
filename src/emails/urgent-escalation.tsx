import React from 'react'

interface Props {
  workOrderNumber: number
  workOrderTitle: string
  workOrderId: string
  priority: string
  createdAt: Date
  ageHours: number
  organizationName: string
  appUrl: string
}

export function UrgentEscalationEmail({
  workOrderNumber,
  workOrderTitle,
  workOrderId,
  priority,
  createdAt,
  ageHours,
  organizationName,
  appUrl,
}: Props) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', margin: 0, padding: 0 }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f9fafb' }}>
          <tr>
            <td align="center" style={{ padding: '32px 16px' }}>
              <table width="600" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <tr>
                  <td style={{ backgroundColor: '#E8830C', padding: '24px 32px' }}>
                    <span style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>Korvia</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '32px', color: '#1a1a1a' }}>
                    <h2 style={{ color: '#DC2626', margin: '0 0 16px', fontSize: '20px', fontWeight: 'bold' }}>
                      Bon de travail urgent non résolu
                    </h2>
                    <p style={{ margin: '0 0 24px', fontSize: '16px' }}>
                      Un bon de travail prioritaire <strong>urgent</strong> dans <strong>{organizationName}</strong> n'a pas été résolu depuis <strong>{ageHours} heures</strong>.
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', marginBottom: '24px' }}>
                      <tr>
                        <td style={{ padding: '20px 24px' }}>
                          <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#374151' }}>
                            <strong>Numéro :</strong> #{workOrderNumber}
                          </p>
                          <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#374151' }}>
                            <strong>Titre :</strong> {workOrderTitle}
                          </p>
                          <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#374151' }}>
                            <strong>Priorité :</strong> {priority}
                          </p>
                          <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#374151' }}>
                            <strong>Créé :</strong> {createdAt.toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}
                          </p>
                          <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                            <strong>Âge :</strong> {ageHours} h
                          </p>
                        </td>
                      </tr>
                    </table>
                    <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#374151' }}>
                      Veuillez intervenir dès que possible ou réassigner ce bon de travail.
                    </p>
                    <a
                      href={`${appUrl}/bons-de-travail/${workOrderId}`}
                      style={{
                        background: '#E8830C',
                        color: '#fff',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        display: 'inline-block',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}
                    >
                      Ouvrir le bon de travail
                    </a>
                  </td>
                </tr>
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

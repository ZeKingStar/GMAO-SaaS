import React from 'react'

interface Props {
  requesterName: string
  workOrderNumber: number
  siteName: string
  organizationName: string
}

export function PortalConfirmationEmail({ requesterName, workOrderNumber, siteName, organizationName }: Props) {
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
                    <p style={{ margin: '0 0 16px', fontSize: '16px' }}>Bonjour {requesterName},</p>
                    <p style={{ margin: '0 0 24px', fontSize: '16px' }}>
                      Votre demande a bien été reçue et a été enregistrée dans notre système de gestion de maintenance.
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', marginBottom: '24px' }}>
                      <tr>
                        <td style={{ padding: '20px 24px' }}>
                          <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Détails de votre demande</p>
                          <p style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a' }}>Demande #{workOrderNumber}</p>
                          <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#374151' }}>
                            <strong>Site :</strong> {siteName}
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#374151' }}>
                            <strong>Organisation :</strong> {organizationName}
                          </p>
                        </td>
                      </tr>
                    </table>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                      Notre équipe de maintenance prendra en charge votre demande dans les meilleurs délais. Vous n&apos;avez aucune autre action à effectuer.
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

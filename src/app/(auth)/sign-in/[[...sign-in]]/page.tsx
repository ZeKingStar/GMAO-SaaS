import { SignIn } from "@clerk/nextjs"

const clerkAppearance = {
  variables: {
    colorPrimary: '#b66428',        // ocre brûlé
    colorBackground: '#ede5d5',     // kraft
    colorText: '#2a2218',           // encre foncée
    colorTextSecondary: '#80766a',  // encre grise
    colorInputBackground: '#f8f4ee', // ivoire
    colorInputText: '#2a2218',
    colorNeutral: '#2a2218',
    borderRadius: '3px',
  },
  elements: {
    card: 'shadow-sm',
    formButtonPrimary: 'hover:opacity-90',
  },
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <SignIn appearance={clerkAppearance} />
    </div>
  )
}

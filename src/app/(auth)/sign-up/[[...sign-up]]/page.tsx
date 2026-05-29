import { SignUp } from "@clerk/nextjs"

const clerkAppearance = {
  variables: {
    colorPrimary: '#b66428',
    colorBackground: '#ede5d5',
    colorText: '#2a2218',
    colorTextSecondary: '#80766a',
    colorInputBackground: '#f8f4ee',
    colorInputText: '#2a2218',
    colorNeutral: '#2a2218',
    borderRadius: '3px',
  },
  elements: {
    card: 'shadow-sm',
    formButtonPrimary: 'hover:opacity-90',
  },
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <SignUp appearance={clerkAppearance} />
    </div>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CARTU · Gestión',
  description: 'CARTU — Sistema de Gestión',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/ToastProvider'

export const metadata: Metadata = {
  title: 'CARTU · Carunchio-Péculo',
  description: 'Sistema de gestión de servicios fúnebres',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CARTU',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A1410',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}

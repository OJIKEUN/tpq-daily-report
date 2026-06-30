import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

import { AuthProvider } from '@/context/AuthContext'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f0fdf4',
}

export const metadata: Metadata = {
  title: 'TPQ Daily Report',
  description: 'Aplikasi pencatatan laporan harian Guru TPQ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TPQ Report',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" data-theme="emerald">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onerror = function(message, source, lineno, colno, error) {
                alert("JS Error: " + message);
              };
              window.addEventListener('unhandledrejection', function(event) {
                alert("Promise Error: " + (event.reason ? event.reason.message : 'Unknown'));
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="app-container">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}

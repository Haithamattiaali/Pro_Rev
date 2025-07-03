import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { DevBanner } from '@/components/dev/DevBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ImpactFlow Pro - Beyond Task Counting',
  description: 'True Project Intelligence with Impact-Based Tracking',
  keywords: 'project management, impact tracking, excel import, team collaboration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <DevBanner />
          {children}
        </Providers>
      </body>
    </html>
  )
}
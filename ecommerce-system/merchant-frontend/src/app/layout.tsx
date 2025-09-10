import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Merchant Dashboard',
  description: '商家管理後台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}

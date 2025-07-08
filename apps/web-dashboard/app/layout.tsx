import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'VHM24 - VendHub Manager 24/7',
  description: 'Система управления кофейными вендинговыми автоматами 24/7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold">
                    VHM24 - VendHub Manager
                    <span className="text-sm text-gray-500 ml-2">24/7</span>
                  </h1>
                </div>
                <nav className="flex items-center space-x-4">
                  <span className="text-green-600 font-medium">⏰ 24/7 Online</span>
                  <a href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</a>
                  <a href="/machines" className="text-gray-700 hover:text-gray-900">Автоматы</a>
                  <a href="/bunkers" className="text-gray-700 hover:text-gray-900">Бункеры</a>
                  <a href="/tasks" className="text-gray-700 hover:text-gray-900">Задачи</a>
                  <a href="/reports" className="text-gray-700 hover:text-gray-900">Отчеты</a>
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}

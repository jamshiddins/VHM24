import type { Metadata } from 'next';
import './globals.css';
import Navigation from './components/Navigation';

export const metadata: Metadata = {
  title: 'VHM24 Dashboard - Система управления вендинговыми автоматами',
  description:
    'Профессиональная система управления вендинговыми автоматами 24/7'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="font-sans">
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="md:pl-64">
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  
}

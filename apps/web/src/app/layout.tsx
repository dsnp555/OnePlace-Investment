import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'OnePlace Invest - Smart Investment Planner',
    description: 'Plan your investments, create portfolio allocations, project returns, and achieve financial independence with OnePlace Invest.',
    keywords: ['investment', 'portfolio', 'SIP', 'mutual funds', 'FIRE', 'financial planning'],
    authors: [{ name: 'OnePlace Invest' }],
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen antialiased">
                {children}
            </body>
        </html>
    );
}

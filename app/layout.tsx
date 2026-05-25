import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solum Safety Consulting — Downloads',
  description: 'Secure member downloads for Solum Safety Consulting templates and forms.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {children}
      </body>
    </html>
  );
}

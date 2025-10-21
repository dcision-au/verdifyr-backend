// app/layout.tsx
import React from 'react';

export const metadata = {
  title: 'Verdifyr',
  description: 'Trust what touches your skin.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
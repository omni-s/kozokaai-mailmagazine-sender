import type { Metadata } from 'next';
import './globals.css';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { getArchiveList } from '@/lib/archive-loader';

export const metadata: Metadata = {
  title: 'Resend メール配信システム',
  description: 'メールマガジン作成・配信システム',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const archives = await getArchiveList();

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <AppShellLayout archives={archives}>
            {children}
          </AppShellLayout>
        </MantineProvider>
      </body>
    </html>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { AppShell, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Sidebar } from './Sidebar';
import type { MailArchive } from '@/lib/archive-loader';
import styles from './AppShellLayout.module.css';

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 280;

export interface AppShellLayoutProps {
  archives: MailArchive[];
  children: React.ReactNode;
}

export function AppShellLayout({ archives, children }: AppShellLayoutProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened] = useDisclosure(true);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = startWidth + (moveEvent.clientX - startX);
        setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [sidebarWidth]
  );

  return (
    <AppShell
      navbar={{
        width: sidebarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding={0}
      style={{ height: '100vh' }}
    >
      <AppShell.Navbar>
        <Box style={{ position: 'relative', height: '100%', width: '100%' }}>
          <Sidebar
            archives={archives}
            mobileOpened={mobileOpened}
            toggleMobile={toggleMobile}
          />
          {/* リサイズハンドル */}
          <Box className={styles.resizeHandle} onMouseDown={handleMouseDown} />
        </Box>
      </AppShell.Navbar>

      <AppShell.Main style={{ overflow: 'auto', height: '100vh' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

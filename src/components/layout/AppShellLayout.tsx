'use client';

import { useState, useCallback, useRef } from 'react';
import { AppShell, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Sidebar } from './Sidebar';
import type { MailArchive } from '@/lib/archive-loader';
import styles from './AppShellLayout.module.css';

const MIN_WIDTH = 0;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 280;
const COLLAPSE_THRESHOLD = 80;

export interface AppShellLayoutProps {
  archives: MailArchive[];
  children: React.ReactNode;
}

export function AppShellLayout({ archives, children }: AppShellLayoutProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const lastWidthRef = useRef(DEFAULT_WIDTH);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const rawWidth = startWidth + (moveEvent.clientX - startX);
        const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, rawWidth));
        const snapped = clamped < COLLAPSE_THRESHOLD ? 0 : Math.max(COLLAPSE_THRESHOLD, clamped);
        setSidebarWidth(snapped);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        setSidebarWidth((current) => {
          if (current > 0) lastWidthRef.current = current;
          return current;
        });
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [sidebarWidth]
  );

  const handleExpand = useCallback(() => {
    setSidebarWidth(lastWidthRef.current);
  }, []);

  return (
    <AppShell
      navbar={{
        width: sidebarWidth,
        breakpoint: 'sm',
        collapsed: {
          mobile: !mobileOpened,
          desktop: sidebarWidth === 0,
        },
      }}
      padding={0}
      style={{ height: '100vh' }}
    >
      <AppShell.Navbar style={{ overflow: 'hidden' }}>
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

      <AppShell.Main style={{ overflow: 'auto', height: '100vh', position: 'relative' }}>
        {sidebarWidth === 0 && (
          <Box className={styles.expandHandle} onClick={handleExpand} />
        )}
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

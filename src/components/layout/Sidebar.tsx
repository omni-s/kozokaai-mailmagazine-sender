'use client';

import { useState, useEffect } from 'react';
import { Stack, Box, Text, Group, Burger, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { SidebarNav } from './SidebarNav';
import { ArchiveAccordion } from './ArchiveAccordion';
import type { MailArchive } from '@/lib/archive-loader';
import styles from './Sidebar.module.css';

interface SidebarProps {
  archives: MailArchive[];
  mobileOpened: boolean;
  toggleMobile: () => void;
}

export function Sidebar({ archives, mobileOpened, toggleMobile }: SidebarProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  // クライアントサイドマウント後にのみアイコンを表示（Hydration Error回避）
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Stack gap={0} h="100%" className={styles.sidebar}>
      {/* ヘッダーセクション（旧SidebarHeader統合） */}
      <Box className={styles.header} p="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <div className={styles.logo}>
              <span className={styles.logoIcon}>R</span>
            </div>
            <div>
              <div className={styles.title}>Resend Mail</div>
              <div className={styles.version}>v0.1.0</div>
            </div>
          </Group>

          <ActionIcon
            variant="default"
            onClick={() => toggleColorScheme()}
            size="lg"
            aria-label="Toggle color scheme"
          >
            {mounted ? (
              colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />
            ) : (
              <Box style={{ width: 18, height: 18 }} />
            )}
          </ActionIcon>
        </Group>
      </Box>

      {/* ナビゲーション・アーカイブセクション */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <SidebarNav />
        <Box mt="xl" px="sm">
          <Text size="xs" fw={600} tt="uppercase" c="dimmed" px="sm" mb="xs">
            配信履歴
          </Text>
          <ArchiveAccordion archives={archives} />
        </Box>
      </Box>

      {/* フッター */}
      <Box className={styles.footer}>
        <Text size="xs" c="dimmed">© 2026 Resend Mail</Text>
      </Box>
    </Stack>
  );
}

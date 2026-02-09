'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
      {/* ヘッダーセクション */}
      <Box className={styles.header}>
        {/* モバイルBurger（デスクトップでは非表示） */}
        <Box hiddenFrom="sm" mb="md">
          <Burger opened={mobileOpened} onClick={toggleMobile} size="sm" />
        </Box>

        {/* ロゴ + タイトル + カラースキーマ */}
        <Group gap="sm" wrap="nowrap" justify="space-between">
          <Group gap="sm" wrap="nowrap">
            <div className={styles.logo}>
              <Image
                src="/icon.webp"
                alt="kozokaAI Logo"
                width={40}
                height={40}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
            <Stack gap={2}>
              <Text className={styles.title}>
                kozokaAI メルマガ作成
              </Text>
              <Text className={styles.version}>
                v0.1.0
              </Text>
            </Stack>
          </Group>
          <ActionIcon
            variant="subtle"
            onClick={() => toggleColorScheme()}
            size="md"
            aria-label="Toggle color scheme"
          >
            {mounted ? (
              colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />
            ) : (
              <Box style={{ width: 16, height: 16 }} />
            )}
          </ActionIcon>
        </Group>
      </Box>

      {/* ナビゲーション・アーカイブセクション */}
      <Box className={styles.content}>
        <SidebarNav />
        <Box mt="lg" px="xs">
          <Text className={styles.sectionTitle}>
            配信履歴
          </Text>
          <ArchiveAccordion archives={archives} />
        </Box>
      </Box>

      {/* フッター */}
      <Box className={styles.footer}>
        <Text size="xs" c="dimmed" ta="center">
          © 2026 kozokaAI
        </Text>
      </Box>
    </Stack>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Stack, Box, Text, Group, Burger, ActionIcon, TextInput, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconLayoutSidebarLeftCollapse, IconSearch, IconX } from '@tabler/icons-react';
import { SidebarNav } from './SidebarNav';
import { ArchiveAccordion } from './ArchiveAccordion';
import type { MailArchive } from '@/lib/archive-loader';
import type { ArchiveAccordionState } from '@/hooks/useArchiveAccordionState';
import styles from './Sidebar.module.css';

interface SidebarProps {
  archives: MailArchive[];
  mobileOpened: boolean;
  toggleMobile: () => void;
  toggleDesktop: () => void;
  accordionState: ArchiveAccordionState;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Sidebar({
  archives,
  mobileOpened,
  toggleMobile,
  toggleDesktop,
  accordionState,
  searchQuery,
  onSearchChange,
}: SidebarProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredArchives = useMemo(() => {
    if (!searchQuery.trim()) return archives;
    const query = searchQuery.toLowerCase().trim();
    return archives.filter(a => a.subject.toLowerCase().includes(query));
  }, [archives, searchQuery]);

  // 検索クエリが変わったとき、結果に該当する年・月を自動展開
  useEffect(() => {
    if (searchQuery.trim() && filteredArchives.length > 0) {
      accordionState.expandForSearch(filteredArchives);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filteredArchives]);

  return (
    <Stack gap={0} h="100%" className={styles.sidebar}>
      {/* ヘッダーセクション */}
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
              <Image
                src="/icon.webp"
                alt="kozokaAI Logo"
                width={32}
                height={32}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
            <div>
              <div className={styles.title}>kozokaAI メールデザインシステム</div>
              <div className={styles.version}>v0.1.0</div>
            </div>
          </Group>

          <Group gap="xs" wrap="nowrap">
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

            <ActionIcon
              variant="subtle"
              onClick={toggleDesktop}
              size="lg"
              aria-label="サイドバーを閉じる"
              visibleFrom="sm"
            >
              <IconLayoutSidebarLeftCollapse size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>

      {/* ナビゲーション・アーカイブセクション */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <SidebarNav />
        <Box mt="xl" px="sm">
          <Text size="xs" fw={600} tt="uppercase" c="dimmed" px="sm" mb="xs">
            配信履歴
          </Text>

          {/* 検索入力 */}
          <Box px="sm" mb="xs">
            <TextInput
              placeholder="件名で検索..."
              size="xs"
              leftSection={<IconSearch size={14} />}
              rightSection={
                searchQuery ? (
                  <ActionIcon
                    variant="transparent"
                    size="xs"
                    onClick={() => onSearchChange('')}
                    aria-label="検索をクリア"
                  >
                    <IconX size={14} />
                  </ActionIcon>
                ) : null
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
            />
          </Box>

          {/* 検索結果0件メッセージ */}
          {searchQuery.trim() && filteredArchives.length === 0 ? (
            <Box px="sm" py="md">
              <Text size="sm" c="dimmed">
                一致する配信はありません
              </Text>
            </Box>
          ) : (
            <ArchiveAccordion
              archives={filteredArchives}
              expandedYears={accordionState.expandedYears}
              expandedMonths={accordionState.expandedMonths}
              toggleYear={accordionState.toggleYear}
              toggleMonth={accordionState.toggleMonth}
            />
          )}
        </Box>
      </Box>

      {/* フッター */}
      <Box className={styles.footer}>
        <Text size="xs" c="dimmed">© 2026 kozokaAI</Text>
      </Box>
    </Stack>
  );
}

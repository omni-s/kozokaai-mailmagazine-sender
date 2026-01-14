'use client';

import Link from 'next/link';
import { Card, Title, Text, Badge, Group } from '@mantine/core';
import type { MailArchive } from '@/lib/archive-loader';
import styles from './ArchiveCard.module.css';

interface ArchiveCardProps {
  archive: MailArchive;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ArchiveCard({ archive }: ArchiveCardProps) {
  const isSent = archive.sentAt !== null;

  return (
    <Link href={`/archives/${archive.path}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card withBorder shadow="sm" radius="md" className={styles.card}>
        <Group justify="space-between" align="flex-start" mb="xs">
          <Title order={4} style={{ flex: 1 }}>{archive.subject}</Title>
          <Badge variant={isSent ? 'filled' : 'light'} color={isSent ? 'blue' : 'gray'}>
            {isSent ? '送信済み' : '未送信'}
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          作成日: {formatDate(archive.createdAt)}
          {isSent && archive.sentAt && (
            <> / 送信日: {formatDate(archive.sentAt)}</>
          )}
        </Text>
      </Card>
    </Link>
  );
}

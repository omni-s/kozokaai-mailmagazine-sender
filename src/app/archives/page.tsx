import { Suspense } from 'react';
import Link from 'next/link';
import { Container, Group, Title, Text, Button, Stack, Center, Loader } from '@mantine/core';
import { getArchiveList } from '@/lib/archive-loader';
import { ArchiveListClient } from './ArchiveListClient';

export const metadata = {
  title: 'メール配信履歴 | Resend メール配信システム',
  description: '過去に送信したメールマガジンの一覧',
};

export default async function ArchivesPage() {
  const archives = await getArchiveList();

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Stack gap="xs">
          <Title order={1}>メール配信履歴</Title>
          <Text c="dimmed">
            過去に送信したメールマガジン {archives.length}件
          </Text>
        </Stack>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Button variant="outline">
            ホームへ戻る
          </Button>
        </Link>
      </Group>

      <Suspense
        fallback={
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader />
              <Text c="dimmed">読み込み中...</Text>
            </Stack>
          </Center>
        }
      >
        {archives.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">メールアーカイブが見つかりませんでした</Text>
          </Center>
        ) : (
          <ArchiveListClient archives={archives} />
        )}
      </Suspense>
    </Container>
  );
}

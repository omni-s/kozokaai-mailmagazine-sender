import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container, Group, Button, Badge, Card, Title, Text, Stack } from '@mantine/core';
import { getArchive } from '@/lib/archive-loader';

interface PageProps {
  params: Promise<{
    yyyy: string;
    mm: string;
    ddMsg: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { yyyy, mm, ddMsg } = await params;
  const archive = await getArchive(yyyy, mm, ddMsg);

  if (!archive) {
    return {
      title: 'アーカイブが見つかりません',
    };
  }

  return {
    title: `${archive.subject} | メール配信履歴`,
    description: `${archive.subject} のプレビュー`,
  };
}

export default async function ArchiveDetailPage({ params }: PageProps) {
  const { yyyy, mm, ddMsg } = await params;

  // メタデータ取得
  const archive = await getArchive(yyyy, mm, ddMsg);

  if (!archive) {
    notFound();
  }

  try {
    // API Route経由でHTMLを取得
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/archives/${yyyy}/${mm}/${ddMsg}/render`,
      {
        cache: 'force-cache', // Next.js Data Cache使用
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const finalHtml = await response.text();
    const isSent = archive.sentAt !== null;

    return (
      <Container size="xl" py="xl" style={{ minHeight: '100vh', backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))' }}>
        <Stack gap="md">
          <Group justify="space-between">
            <Link href="/archives" style={{ textDecoration: 'none' }}>
              <Button variant="outline">← 一覧へ戻る</Button>
            </Link>
            <Badge variant={isSent ? 'filled' : 'light'} color={isSent ? 'green' : 'gray'}>
              {isSent ? '送信済み' : '未送信'}
            </Badge>
          </Group>

          <Card withBorder shadow="sm" radius="md">
            <Title order={2} mb="xs">{archive.subject}</Title>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                作成日: {archive.createdAt.toLocaleDateString('ja-JP')}
              </Text>
              {archive.sentAt && (
                <Text size="sm" c="dimmed">
                  送信日: {new Date(archive.sentAt).toLocaleDateString('ja-JP')}
                </Text>
              )}
              <Text size="sm" c="dimmed">
                Audience ID: {archive.audienceId}
              </Text>
            </Stack>
          </Card>

          <Card withBorder shadow="sm" radius="md">
            <Title order={3} mb="md">メールプレビュー</Title>
            <iframe
              srcDoc={finalHtml}
              style={{ width: '100%', height: '800px', border: 0, borderRadius: 'var(--mantine-radius-md)' }}
              sandbox="allow-same-origin"
              title="メールプレビュー"
            />
          </Card>
        </Stack>
      </Container>
    );
  } catch (error) {
    return (
      <Container size="xl" py="xl" style={{ minHeight: '100vh', backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))' }}>
        <Stack gap="md">
          <Link href="/archives" style={{ textDecoration: 'none' }}>
            <Button variant="outline">← 一覧へ戻る</Button>
          </Link>
          <Card withBorder shadow="sm" radius="md">
            <Title order={2} c="red" mb="md">
              エラーが発生しました
            </Title>
            <Text>{error instanceof Error ? error.message : 'メールのレンダリングに失敗しました'}</Text>
          </Card>
        </Stack>
      </Container>
    );
  }
}

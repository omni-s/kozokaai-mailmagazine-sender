'use client';

import Link from 'next/link';
import { Badge, Divider, Stack, Group, List, Text, Code, Avatar, SimpleGrid } from '@mantine/core';

export function WorkflowSection() {
  return (
    <Stack gap="xl">
      {/* 使い方セクション */}
      <Stack gap="md">
        <Group gap="xs">
          <Badge variant="light" color="gray">使い方</Badge>
        </Group>
        <List spacing="sm" size="sm">
          <List.Item
            icon={
              <Avatar size={24} radius="xl" color="blue">1</Avatar>
            }
          >
            <Text size="sm" c="dimmed">
              <Link href="/draft" style={{ color: 'var(--mantine-color-blue-filled)', textDecoration: 'none' }}>
                メール編集画面
              </Link>
              でメールをデザイン
            </Text>
          </List.Item>
          <List.Item
            icon={
              <Avatar size={24} radius="xl" color="blue">2</Avatar>
            }
          >
            <Text size="sm" c="dimmed">
              画像は <Code>public/MAIL-ASSETS/</Code> に配置
            </Text>
          </List.Item>
          <List.Item
            icon={
              <Avatar size={24} radius="xl" color="blue">3</Avatar>
            }
          >
            <Text size="sm" c="dimmed">
              完成したら <Code>pnpm run commit</Code> を実行
            </Text>
          </List.Item>
          <List.Item
            icon={
              <Avatar size={24} radius="xl" color="blue">4</Avatar>
            }
          >
            <Text size="sm" c="dimmed">
              PR作成 → レビュー → マージで本番配信
            </Text>
          </List.Item>
        </List>
      </Stack>

      <Divider />

      {/* ワークフローセクション */}
      <Stack gap="md">
        <Group gap="xs">
          <Badge variant="light" color="gray">ワークフロー</Badge>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Stack gap="xs">
            <Avatar size={40} radius="md" color="blue" variant="light">
              <Text fw={600} size="lg">1</Text>
            </Avatar>
            <Text fw={500}>ローカル制作</Text>
            <Text size="sm" c="dimmed">
              メールをデザイン → pnpm run commit
            </Text>
          </Stack>
          <Stack gap="xs">
            <Avatar size={40} radius="md" color="blue" variant="light">
              <Text fw={600} size="lg">2</Text>
            </Avatar>
            <Text fw={500}>レビュー</Text>
            <Text size="sm" c="dimmed">
              PR作成 → テストメール確認
            </Text>
          </Stack>
          <Stack gap="xs">
            <Avatar size={40} radius="md" color="blue" variant="light">
              <Text fw={600} size="lg">3</Text>
            </Avatar>
            <Text fw={500}>配信</Text>
            <Text size="sm" c="dimmed">
              マージ → 承認 → 本番送信
            </Text>
          </Stack>
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}

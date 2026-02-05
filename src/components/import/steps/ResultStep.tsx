'use client';

import { Stack, Text, Group, Button, Paper, Alert, Table, ScrollArea } from '@mantine/core';
import { IconCheck, IconAlertTriangle, IconRefresh, IconReload } from '@tabler/icons-react';
import type { ImportCompleteEvent } from '@/lib/import-contacts-schema';

interface ResultStepProps {
  result: ImportCompleteEvent | null;
  onReset: () => void;
  onRetryFailed?: () => void;
}

/**
 * Step 6: 結果表示
 */
export function ResultStep({ result, onReset, onRetryFailed }: ResultStepProps) {
  if (!result) {
    return (
      <Stack gap="lg" mt="md">
        <Text c="dimmed">結果データがありません。</Text>
        <Button leftSection={<IconRefresh size={16} />} onClick={onReset}>
          最初からやり直す
        </Button>
      </Stack>
    );
  }

  const successRate = result.total > 0
    ? ((result.successCount / result.total) * 100).toFixed(1)
    : '0';

  const allSuccess = result.failCount === 0;

  return (
    <Stack gap="lg" mt="md">
      {allSuccess ? (
        <Alert icon={<IconCheck size={16} />} title="インポート完了" color="green">
          すべてのコンタクトを正常にインポートしました。
        </Alert>
      ) : (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="インポート完了"
          color="yellow"
        >
          一部のコンタクトのインポートに失敗しました。
        </Alert>
      )}

      <Paper shadow="xs" p="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text>合計</Text>
            <Text fw={500}>{result.total.toLocaleString()}件</Text>
          </Group>
          <Group justify="space-between">
            <Text c="green">成功</Text>
            <Text fw={500} c="green">
              {result.successCount.toLocaleString()}件
            </Text>
          </Group>
          <Group justify="space-between">
            <Text c="red">失敗</Text>
            <Text fw={500} c="red">
              {result.failCount.toLocaleString()}件
            </Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed">成功率</Text>
            <Text fw={500}>{successRate}%</Text>
          </Group>
        </Stack>
      </Paper>

      {result.failures.length > 0 && (
        <div>
          <Text fw={500} mb="xs">
            失敗一覧
          </Text>
          <ScrollArea h={200}>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>エラー</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {result.failures.map((f, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{f.email}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="red">
                        {f.error}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </div>
      )}

      <Group justify="center" mt="md">
        {result.failures.length > 0 && onRetryFailed && (
          <Button
            leftSection={<IconReload size={16} />}
            variant="light"
            color="yellow"
            onClick={onRetryFailed}
          >
            失敗分を再インポート（{result.failures.length}件）
          </Button>
        )}
        <Button leftSection={<IconRefresh size={16} />} onClick={onReset}>
          別のCSVをインポートする
        </Button>
      </Group>
    </Stack>
  );
}

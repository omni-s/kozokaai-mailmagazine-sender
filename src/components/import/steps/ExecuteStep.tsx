'use client';

import { useState, useEffect, useRef } from 'react';
import { Stack, Text, Group, Button, Progress, Paper, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertTriangle } from '@tabler/icons-react';
import type {
  PropertyConfig,
  ColumnAnalysisJson,
  ImportEvent,
  ImportCompleteEvent,
} from '@/lib/import-contacts-schema';

interface ExecuteStepProps {
  records: Record<string, string>[];
  audienceId: string;
  propertyConfigs: PropertyConfig[];
  columnAnalysis: ColumnAnalysisJson | null;
  onComplete: (result: ImportCompleteEvent) => void;
  onBack: () => void;
}

/**
 * Step 5: インポート実行
 */
export function ExecuteStep({
  records,
  audienceId,
  propertyConfigs,
  columnAnalysis,
  onComplete,
  onBack,
}: ExecuteStepProps) {
  const [progress, setProgress] = useState({
    current: 0,
    total: records.length,
    successCount: 0,
    failCount: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // インポート開始
  useEffect(() => {
    if (started || !columnAnalysis) return;
    setStarted(true);

    const controller = new AbortController();
    abortRef.current = controller;

    async function runImport() {
      try {
        const res = await fetch('/api/import-contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records,
            audienceId,
            propertyConfigs,
            columnAnalysis,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || `HTTP ${res.status}`);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setError('Response body is not readable');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6);

            try {
              const event: ImportEvent = JSON.parse(json);

              if (event.type === 'progress') {
                setProgress({
                  current: event.current,
                  total: event.total,
                  successCount: event.successCount,
                  failCount: event.failCount,
                });
              } else if (event.type === 'complete') {
                onComplete(event);
              } else if (event.type === 'error') {
                setError(event.message);
              }
            } catch (e) {
              console.error('SSE parse error:', e, json);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    }

    runImport();

    return () => {
      controller.abort();
    };
  }, [started, records, audienceId, propertyConfigs, columnAnalysis, onComplete]);

  const percent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  // 推定残り時間（簡易計算）
  const estimatedRemaining = Math.ceil(
    ((progress.total - progress.current) * 0.667) / 60
  );

  if (error) {
    return (
      <Stack gap="lg" mt="md">
        <Alert icon={<IconAlertTriangle size={16} />} title="エラー" color="red">
          {error}
        </Alert>
        <Group justify="flex-start">
          <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
            戻る
          </Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" mt="md">
      <Text size="lg" fw={500} ta="center">
        インポート中...
      </Text>

      <Paper shadow="xs" p="md" withBorder>
        <Stack gap="sm">
          <Progress value={percent} size="xl" striped animated />

          <Group justify="space-between">
            <Text size="sm">
              {progress.current.toLocaleString()} / {progress.total.toLocaleString()}
            </Text>
            <Text size="sm">{percent.toFixed(1)}%</Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm" c="green">
              成功: {progress.successCount.toLocaleString()}
            </Text>
            <Text size="sm" c="red">
              失敗: {progress.failCount.toLocaleString()}
            </Text>
          </Group>

          {estimatedRemaining > 0 && (
            <Text size="xs" c="dimmed" ta="center">
              推定残り時間: 約{estimatedRemaining}分
            </Text>
          )}
        </Stack>
      </Paper>

      <Text size="xs" c="dimmed" ta="center">
        ブラウザを閉じないでください。インポートが中断されます。
      </Text>
    </Stack>
  );
}

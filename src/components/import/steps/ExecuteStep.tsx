'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Stack, Text, Group, Button, Progress, Paper, Alert, Loader } from '@mantine/core';
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
 * SSEチャンクからイベントをパースする
 *
 * バッファを受け取り、パース済みイベントと残りのバッファを返す。
 * 複数の data: 行が1チャンクに含まれるケースにも対応。
 */
function parseSSEBuffer(buffer: string): { events: ImportEvent[]; remaining: string } {
  const events: ImportEvent[] = [];
  const segments = buffer.split('\n\n');
  const remaining = segments.pop() || '';

  for (const segment of segments) {
    // 各セグメント内を行単位で処理（複数 data: 行が連結される場合に対応）
    for (const rawLine of segment.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;
      // SSEコメント行をスキップ（フラッシュ用パディング対策）
      if (line.startsWith(':')) continue;
      if (!line.startsWith('data: ')) continue;

      const json = line.slice(6).trim();
      if (!json) continue;

      try {
        const event: ImportEvent = JSON.parse(json);
        events.push(event);
      } catch (e) {
        console.error('[ExecuteStep] SSE parse error:', e, 'raw:', json);
      }
    }
  }

  return { events, remaining };
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
  const startedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // onComplete を ref で安定化（useEffect の依存配列から除外）
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // 最新の progress を ref で保持（ストリーム完了時のフォールバック用）
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const handleComplete = useCallback((event: ImportCompleteEvent) => {
    onCompleteRef.current(event);
  }, []);

  // インポート開始
  useEffect(() => {
    if (!columnAnalysis) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    async function runImport() {
      let completeCalled = false;

      try {
        console.log('[ExecuteStep] Starting import request...');
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

        console.log('[ExecuteStep] Response status:', res.status, res.ok);
        console.log('[ExecuteStep] Content-Type:', res.headers.get('content-type'));

        if (!res.ok) {
          // Content-Type に応じてエラーメッセージを取得
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            setError(data.error || `HTTP ${res.status}`);
          } else {
            const text = await res.text();
            setError(`HTTP ${res.status}: ${text.substring(0, 200)}`);
          }
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
          if (done) {
            console.log('[ExecuteStep] Stream ended (done=true)');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          console.log('[ExecuteStep] Chunk received, length:', chunk.length);
          buffer += chunk;

          const { events, remaining } = parseSSEBuffer(buffer);
          buffer = remaining;

          for (const event of events) {
            console.log('[ExecuteStep] Event:', event.type, event);

            if (event.type === 'progress') {
              setProgress({
                current: event.current,
                total: event.total,
                successCount: event.successCount,
                failCount: event.failCount,
              });
            } else if (event.type === 'complete') {
              completeCalled = true;
              handleComplete(event);
            } else if (event.type === 'error') {
              setError(event.message);
            }
          }
        }

        // 残りのバッファを処理（ストリーム終了後に未処理データがある場合）
        if (buffer.trim()) {
          console.log('[ExecuteStep] Processing remaining buffer:', buffer.substring(0, 200));
          const { events } = parseSSEBuffer(buffer + '\n\n');
          for (const event of events) {
            console.log('[ExecuteStep] Remaining event:', event.type, event);
            if (event.type === 'progress') {
              setProgress({
                current: event.current,
                total: event.total,
                successCount: event.successCount,
                failCount: event.failCount,
              });
            } else if (event.type === 'complete') {
              completeCalled = true;
              handleComplete(event);
            } else if (event.type === 'error') {
              setError(event.message);
            }
          }
        }

        // complete イベントを受信しないままストリームが終了した場合のフォールバック
        if (!completeCalled) {
          const p = progressRef.current;
          console.warn('[ExecuteStep] Stream ended without complete event. Fallback triggered.');
          if (p.current > 0) {
            handleComplete({
              type: 'complete',
              total: p.total,
              successCount: p.successCount,
              failCount: p.failCount,
              failures: [],
            });
          } else {
            setError('ストリームが予期せず終了しました。サーバーログを確認してください。');
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('[ExecuteStep] Import error:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    }

    runImport();

    return () => {
      controller.abort();
      startedRef.current = false;
    };
  }, [records, audienceId, propertyConfigs, columnAnalysis, handleComplete]);

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
      <Group justify="center" gap="md">
        <Loader size="md" />
        <Text size="lg" fw={500}>
          インポート中...
        </Text>
      </Group>

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

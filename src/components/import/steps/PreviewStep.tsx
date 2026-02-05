'use client';

import { Stack, Text, Group, Button, Alert, Badge, Code } from '@mantine/core';
import { IconCheck, IconAlertTriangle, IconArrowRight, IconArrowLeft } from '@tabler/icons-react';
import type { ColumnAnalysis } from '@/lib/csv-parser';
import { CsvPreviewTable } from '../CsvPreviewTable';

interface PreviewStepProps {
  records: Record<string, string>[];
  columnAnalysis: ColumnAnalysis | null;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Step 2: CSV プレビュー
 */
export function PreviewStep({
  records,
  columnAnalysis,
  onConfirm,
  onBack,
}: PreviewStepProps) {
  const hasEmailColumn = !!columnAnalysis?.emailColumn;

  return (
    <Stack gap="lg" mt="md">
      {/* email カラム検出結果 */}
      {hasEmailColumn ? (
        <Alert
          icon={<IconCheck size={16} />}
          title="emailカラムを検出しました"
          color="green"
        >
          カラム名: <Code>{columnAnalysis!.emailColumn}</Code>
        </Alert>
      ) : (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="emailカラムが見つかりません"
          color="red"
        >
          CSVに email, emailaddress, mail, Eメール, メールアドレス
          のいずれかのカラムが必要です。
        </Alert>
      )}

      {/* カラムマッピング */}
      <div>
        <Text fw={500} mb="xs">
          カラムマッピング
        </Text>
        <Group gap="xs">
          {columnAnalysis &&
            Array.from(columnAnalysis.standard.entries()).map(
              ([csvCol, field]) => (
                <Badge key={csvCol} color="blue" variant="light">
                  {csvCol} → {field}
                </Badge>
              )
            )}
        </Group>

        {columnAnalysis && columnAnalysis.custom.length > 0 && (
          <>
            <Text size="sm" c="dimmed" mt="xs">
              カスタムプロパティ候補: {columnAnalysis.custom.length}件
            </Text>
            <Group gap="xs" mt="xs">
              {columnAnalysis.custom.map((col) => (
                <Badge key={col} color="yellow" variant="light">
                  {col}
                </Badge>
              ))}
            </Group>
          </>
        )}
      </div>

      {/* レコード数 */}
      <Text size="sm">
        レコード数: <strong>{records.length.toLocaleString()}件</strong>
      </Text>

      {/* プレビューテーブル */}
      <CsvPreviewTable records={records.slice(0, 10)} />

      {records.length > 10 && (
        <Text size="xs" c="dimmed" ta="center">
          ...他 {(records.length - 10).toLocaleString()} 件のレコード
        </Text>
      )}

      {/* ボタン */}
      <Group justify="space-between" mt="md">
        <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
          戻る
        </Button>
        <Button
          rightSection={<IconArrowRight size={16} />}
          onClick={onConfirm}
          disabled={!hasEmailColumn}
        >
          次へ
        </Button>
      </Group>
    </Stack>
  );
}

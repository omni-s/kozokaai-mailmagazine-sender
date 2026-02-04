'use client';

import { useCallback } from 'react';
import {
  Stack,
  Text,
  Group,
  Button,
  Paper,
  TextInput,
  NumberInput,
  Radio,
  Checkbox,
  Code,
} from '@mantine/core';
import { IconArrowRight, IconArrowLeft } from '@tabler/icons-react';
import type { ColumnAnalysis } from '@/lib/csv-parser';
import type { PropertyConfig } from '@/lib/import-contacts-schema';

interface PropertyConfigStepProps {
  records: Record<string, string>[];
  columnAnalysis: ColumnAnalysis | null;
  propertyConfigs: PropertyConfig[];
  onChange: (configs: PropertyConfig[]) => void;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Step 3: カスタムプロパティ設定
 */
export function PropertyConfigStep({
  records,
  columnAnalysis,
  propertyConfigs,
  onChange,
  onConfirm,
  onBack,
}: PropertyConfigStepProps) {
  // 個別のプロパティ設定を更新
  const updateConfig = useCallback(
    (index: number, updates: Partial<PropertyConfig>) => {
      const newConfigs = [...propertyConfigs];
      newConfigs[index] = { ...newConfigs[index], ...updates };
      onChange(newConfigs);
    },
    [propertyConfigs, onChange]
  );

  // プロパティを無効化（配列から削除）
  const toggleInclude = useCallback(
    (index: number, included: boolean) => {
      if (!included) {
        const newConfigs = propertyConfigs.filter((_, i) => i !== index);
        onChange(newConfigs);
      }
    },
    [propertyConfigs, onChange]
  );

  // 有効なカスタムプロパティのみ
  const enabledConfigs = propertyConfigs;

  if (!columnAnalysis || columnAnalysis.custom.length === 0) {
    return (
      <Stack gap="lg" mt="md">
        <Text c="dimmed">カスタムプロパティはありません。</Text>
        <Group justify="space-between" mt="md">
          <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
            戻る
          </Button>
          <Button rightSection={<IconArrowRight size={16} />} onClick={onConfirm}>
            次へ
          </Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" mt="md">
      <Text size="sm" c="dimmed">
        カスタムプロパティの型とfallback値を設定してください。
        インポートしないプロパティはチェックを外してください。
      </Text>

      {enabledConfigs.map((config, index) => {
        // サンプル値を取得（最大3件）
        const samples = records
          .slice(0, 3)
          .map((r) => r[config.columnName])
          .filter((v) => v !== undefined && v !== '');

        return (
          <Paper key={config.columnName} shadow="xs" p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Checkbox
                  label={
                    <Text fw={500}>
                      {config.columnName} → <Code>{config.key}</Code>
                    </Text>
                  }
                  checked={true}
                  onChange={(e) => toggleInclude(index, e.currentTarget.checked)}
                />
              </Group>

              {samples.length > 0 && (
                <Text size="xs" c="dimmed">
                  サンプル値: {samples.join(', ')}
                </Text>
              )}

              <Group grow>
                <Radio.Group
                  label="型"
                  value={config.type}
                  onChange={(value) =>
                    updateConfig(index, {
                      type: value as 'string' | 'number',
                      fallbackValue: null,
                    })
                  }
                >
                  <Group mt="xs">
                    <Radio value="string" label="string（テキスト）" />
                    <Radio value="number" label="number（数値）" />
                  </Group>
                </Radio.Group>
              </Group>

              {config.type === 'string' ? (
                <TextInput
                  label="Fallback値"
                  description="値が空の場合に使用（空欄でnull）"
                  placeholder="例: 未設定"
                  value={(config.fallbackValue as string) || ''}
                  onChange={(e) =>
                    updateConfig(index, {
                      fallbackValue: e.currentTarget.value || null,
                    })
                  }
                />
              ) : (
                <NumberInput
                  label="Fallback値"
                  description="値が空の場合に使用（空欄でnull）"
                  placeholder="例: 0"
                  value={config.fallbackValue as number | ''}
                  onChange={(value) =>
                    updateConfig(index, {
                      fallbackValue: value === '' ? null : value,
                    })
                  }
                />
              )}
            </Stack>
          </Paper>
        );
      })}

      <Group justify="space-between" mt="md">
        <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
          戻る
        </Button>
        <Button rightSection={<IconArrowRight size={16} />} onClick={onConfirm}>
          次へ
        </Button>
      </Group>
    </Stack>
  );
}

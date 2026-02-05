'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Group,
  Button,
  Select,
  TextInput,
  Loader,
  Alert,
} from '@mantine/core';
import { IconArrowRight, IconArrowLeft, IconAlertTriangle } from '@tabler/icons-react';

interface Segment {
  id: string;
  name: string;
  createdAt: string;
}

interface SegmentStepProps {
  audienceId: string;
  onChange: (id: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Step 4: Segment 選択
 *
 * Resend Segment（旧Audience）を選択するステップ
 */
export function SegmentStep({
  audienceId,
  onChange,
  onConfirm,
  onBack,
}: SegmentStepProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState(false);

  // Segment 一覧を取得
  useEffect(() => {
    async function fetchSegments() {
      try {
        const res = await fetch('/api/import-contacts/segments');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        const fetchedSegments = data.segments || [];
        setSegments(fetchedSegments);

        // Segment が 0件の場合は手動入力モードに切り替え
        if (fetchedSegments.length === 0) {
          setManualInput(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSegments();
  }, []);

  // UUID バリデーション
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    audienceId
  );

  if (loading) {
    return (
      <Stack gap="lg" mt="md" align="center">
        <Loader />
        <Text size="sm" c="dimmed">
          Segment一覧を取得中...
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" mt="md">
      {error && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Segment一覧の取得に失敗しました"
          color="yellow"
        >
          {error}
        </Alert>
      )}

      {!manualInput && segments.length > 0 ? (
        <>
          <Select
            label="Segment を選択"
            placeholder="選択してください"
            data={segments.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
            value={audienceId}
            onChange={(value) => onChange(value || '')}
            searchable
            clearable
            comboboxProps={{ withinPortal: false }}
          />
          <Button variant="subtle" size="xs" onClick={() => setManualInput(true)}>
            UUIDを直接入力する
          </Button>
        </>
      ) : (
        <>
          <TextInput
            label="Segment ID (UUID)"
            placeholder="例: 78261eea-8f8b-4381-83c6-79fa7120f1cf"
            value={audienceId}
            onChange={(e) => onChange(e.currentTarget.value.trim())}
            error={
              audienceId && !isValidUUID ? 'UUID形式で入力してください' : null
            }
          />
          {segments.length === 0 && !error && (
            <Text size="xs" c="dimmed">
              Resendに登録されたSegmentがないため、UUIDを直接入力してください。
            </Text>
          )}
          {segments.length > 0 && (
            <Button
              variant="subtle"
              size="xs"
              onClick={() => setManualInput(false)}
            >
              リストから選択する
            </Button>
          )}
        </>
      )}

      <Group justify="space-between" mt="md">
        <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
          戻る
        </Button>
        <Button
          rightSection={<IconArrowRight size={16} />}
          onClick={onConfirm}
          disabled={!audienceId || !isValidUUID}
        >
          インポート開始
        </Button>
      </Group>
    </Stack>
  );
}

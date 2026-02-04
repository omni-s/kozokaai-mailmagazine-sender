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

interface Audience {
  id: string;
  name: string;
  createdAt: string;
}

interface AudienceStepProps {
  audienceId: string;
  onChange: (id: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Step 4: Audience 選択
 */
export function AudienceStep({
  audienceId,
  onChange,
  onConfirm,
  onBack,
}: AudienceStepProps) {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState(false);

  // Audience 一覧を取得
  useEffect(() => {
    async function fetchAudiences() {
      try {
        const res = await fetch('/api/import-contacts/audiences');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setAudiences(data.audiences || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAudiences();
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
          Audience一覧を取得中...
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" mt="md">
      {error && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Audience一覧の取得に失敗しました"
          color="yellow"
        >
          {error}
        </Alert>
      )}

      {!manualInput && audiences.length > 0 ? (
        <>
          <Select
            label="Audience を選択"
            placeholder="選択してください"
            data={audiences.map((a) => ({
              value: a.id,
              label: a.name,
            }))}
            value={audienceId}
            onChange={(value) => onChange(value || '')}
            searchable
            clearable
          />
          <Button variant="subtle" size="xs" onClick={() => setManualInput(true)}>
            UUIDを直接入力する
          </Button>
        </>
      ) : (
        <>
          <TextInput
            label="Audience ID (UUID)"
            placeholder="例: 78261eea-8f8b-4381-83c6-79fa7120f1cf"
            value={audienceId}
            onChange={(e) => onChange(e.currentTarget.value.trim())}
            error={
              audienceId && !isValidUUID ? 'UUID形式で入力してください' : null
            }
          />
          {audiences.length > 0 && (
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

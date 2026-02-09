'use client';

import { useCallback } from 'react';
import { Stack, Text, Group, rem } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconUpload, IconX, IconFile } from '@tabler/icons-react';

interface UploadStepProps {
  onUpload: (content: string) => void;
}

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Step 1: CSV ファイルアップロード
 */
export function UploadStep({ onUpload }: UploadStepProps) {
  const handleDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          onUpload(content);
        }
      };
      reader.readAsText(file, 'UTF-8');
    },
    [onUpload]
  );

  return (
    <Stack gap="lg" mt="md">
      <Text size="sm" c="dimmed">
        CSVファイルをドラッグ&ドロップするか、クリックしてファイルを選択してください。
      </Text>

      <Dropzone
        onDrop={handleDrop}
        onReject={(files) => {
          console.error('File rejected:', files);
          alert(
            `ファイルが拒否されました。${MAX_SIZE_MB}MB以下のCSVファイルを選択してください。`
          );
        }}
        maxSize={MAX_SIZE_BYTES}
        accept={[MIME_TYPES.csv, 'text/csv', 'application/vnd.ms-excel']}
        multiple={false}
      >
        <Group
          justify="center"
          gap="xl"
          mih={220}
          style={{ pointerEvents: 'none' }}
        >
          <Dropzone.Accept>
            <IconUpload
              style={{
                width: rem(52),
                height: rem(52),
                color: 'var(--mantine-color-blue-6)',
              }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{
                width: rem(52),
                height: rem(52),
                color: 'var(--mantine-color-red-6)',
              }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFile
              style={{
                width: rem(52),
                height: rem(52),
                color: 'var(--mantine-color-dimmed)',
              }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              CSVファイルをここにドロップ
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              またはクリックしてファイルを選択（最大{MAX_SIZE_MB}MB）
            </Text>
          </div>
        </Group>
      </Dropzone>

      <Text size="xs" c="dimmed">
        <strong>必須:</strong> CSVには <code>email</code>{' '}
        カラム（または類似の名前）が必要です。
      </Text>
    </Stack>
  );
}

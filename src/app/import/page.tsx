import { Title, Text, Stack } from '@mantine/core';
import { ImportWizard } from '@/components/import/ImportWizard';

export const metadata = {
  title: 'コンタクト一括登録 | Resend メール配信システム',
  description: 'CSVファイルからResend Contactを一括インポート',
};

/**
 * コンタクト一括登録ページ
 */
export default function ImportPage() {
  return (
    <Stack gap="md" p="xl">
      <div>
        <Title order={1} size="h2">
          コンタクト一括登録
        </Title>
        <Text c="dimmed" size="sm">
          CSVファイルからResend Audienceにコンタクトを一括インポートします。
        </Text>
      </div>

      <ImportWizard />
    </Stack>
  );
}

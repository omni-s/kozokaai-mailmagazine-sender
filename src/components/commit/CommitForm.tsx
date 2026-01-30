'use client';

import { useState } from 'react';
import { TextInput, Button, Select, Stack, Group, Alert, Modal } from '@mantine/core';
import { format, parse, isValid } from 'date-fns';

/**
 * 配信準備フォームのインターフェース
 */
export interface CommitAnswers {
  commitMessage: string;
  subject: string;
  segmentId: string;
  scheduleType: 'immediate' | 'scheduled';
  scheduledAt?: string; // ISO 8601形式（JSTで入力、UTCに変換）
}

interface CommitFormProps {
  onSuccess?: () => void;
}

interface ApiResponse {
  success: boolean;
  message: string;
  archiveDir?: string;
}

export function CommitForm({ onSuccess }: CommitFormProps) {
  const [answers, setAnswers] = useState<CommitAnswers>({
    commitMessage: '',
    subject: '',
    segmentId: 'a355a0bd-32fa-4ef4-b6d5-7341f702d35b',
    scheduleType: 'immediate',
    scheduledAt: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 上書き確認用State
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<CommitAnswers | null>(null);

  /**
   * バリデーション関数
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // コミットメッセージ
    if (!answers.commitMessage || answers.commitMessage.trim().length === 0) {
      newErrors.commitMessage = 'コミットメッセージは必須です';
    } else if (/[\/\\:*?"<>|]/.test(answers.commitMessage)) {
      newErrors.commitMessage = 'ディレクトリ名に使用できない文字が含まれています';
    }

    // メール件名
    if (!answers.subject || answers.subject.trim().length === 0) {
      newErrors.subject = 'メール件名は必須です';
    }

    // Segment ID
    const segmentId = answers.segmentId.trim();
    if (segmentId.length === 0) {
      newErrors.segmentId = 'Segment IDは必須です';
    } else if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segmentId)
    ) {
      newErrors.segmentId = 'Segment IDの形式が不正です（UUID形式で入力してください）';
    }

    // 配信日時（予約配信の場合）
    if (answers.scheduleType === 'scheduled') {
      if (!answers.scheduledAt || answers.scheduledAt.trim().length === 0) {
        newErrors.scheduledAt = '配信日時は必須です';
      } else {
        const parsedDate = parse(answers.scheduledAt.trim(), 'yyyy-MM-dd HH:mm', new Date());
        if (!isValid(parsedDate)) {
          newErrors.scheduledAt = '日時の形式が不正です（例: 2026-01-20 18:00）';
        } else if (parsedDate <= new Date()) {
          newErrors.scheduledAt = '配信日時は現在より未来の日時を指定してください';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * API呼び出し実行（共通化）
   */
  const executeCommit = async (data: CommitAnswers, overwrite: boolean = false) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, overwrite }),
      });

      const responseData: ApiResponse = await response.json();

      // 409 Conflict: アーカイブ既存エラー
      if (response.status === 409 && !overwrite) {
        setPendingRequest(data);
        setShowOverwriteConfirm(true);
        setLoading(false);
        return;
      }

      // その他のエラー
      if (!response.ok || !responseData.success) {
        setResult({
          success: false,
          message: responseData.message || 'エラーが発生しました',
        });
        setLoading(false);
        return;
      }

      // 成功
      setResult(responseData);
      setShowOverwriteConfirm(false);
      setPendingRequest(null);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '不明なエラーが発生しました',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * フォーム送信ハンドラ
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    await executeCommit(answers, false);
  };

  /**
   * 上書き確認ダイアログ - 実行ボタン
   */
  const handleOverwriteConfirm = async () => {
    if (!pendingRequest) return;
    setShowOverwriteConfirm(false);
    await executeCommit(pendingRequest, true);
  };

  /**
   * 上書き確認ダイアログ - キャンセルボタン
   */
  const handleOverwriteCancel = () => {
    setShowOverwriteConfirm(false);
    setPendingRequest(null);
    setResult({
      success: false,
      message: 'アーカイブ名を変更して再度お試しください',
    });
  };

  /**
   * フィールド変更ハンドラ（エラーメッセージクリア）
   */
  const handleFieldChange = (field: keyof CommitAnswers, value: string) => {
    setAnswers({ ...answers, [field]: value });
    // エラーメッセージをクリア
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {/* コミットメッセージ */}
        <TextInput
          label="コミットメッセージ"
          placeholder="summer-sale"
          description="ディレクトリ名に使用されます（例: 20-summer-sale）"
          value={answers.commitMessage}
          onChange={(e) => handleFieldChange('commitMessage', e.target.value)}
          error={errors.commitMessage}
          required
          disabled={loading}
        />

        {/* メール件名 */}
        <TextInput
          label="メール件名"
          placeholder="【サマーセール】最大50%OFFのお知らせ"
          description="Resendで配信されるメールの件名"
          value={answers.subject}
          onChange={(e) => handleFieldChange('subject', e.target.value)}
          error={errors.subject}
          required
          disabled={loading}
        />

        {/* Resend Segment ID */}
        <TextInput
          label="Resend Segment ID"
          placeholder="a355a0bd-32fa-4ef4-b6d5-7341f702d35b"
          description="Resendで作成したAudienceのSegment ID（UUID形式）"
          value={answers.segmentId}
          onChange={(e) => handleFieldChange('segmentId', e.target.value)}
          error={errors.segmentId}
          required
          disabled={loading}
        />

        {/* 配信タイミング */}
        <Select
          label="配信タイミング"
          description="即時配信: PRマージ後すぐ / 予約配信: 指定日時に自動配信"
          data={[
            { value: 'immediate', label: '即時配信（PR作成後、手動承認して配信）' },
            { value: 'scheduled', label: '予約配信（指定日時に自動配信）' },
          ]}
          value={answers.scheduleType}
          onChange={(value) =>
            handleFieldChange('scheduleType', value as 'immediate' | 'scheduled')
          }
          disabled={loading}
        />

        {/* 配信日時（予約配信の場合のみ表示） */}
        {answers.scheduleType === 'scheduled' && (
          <TextInput
            label="配信日時（JST）"
            placeholder={`${format(new Date(), 'yyyy-MM-dd')} 18:00`}
            description="日本時間で配信日時を指定してください（例: 2026-01-25 10:00）"
            value={answers.scheduledAt}
            onChange={(e) => handleFieldChange('scheduledAt', e.target.value)}
            error={errors.scheduledAt}
            required
            disabled={loading}
          />
        )}

        {/* 送信ボタン */}
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={loading} size="md">
            {loading ? '配信準備中...' : '配信準備を開始'}
          </Button>
        </Group>

        {/* 結果表示 */}
        {result && (
          <Alert
            color={result.success ? 'green' : 'red'}
            title={result.success ? '成功' : 'エラー'}
            mt="md"
          >
            {result.message}
            {result.success && result.archiveDir && (
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                アーカイブ: <code>{result.archiveDir}</code>
              </div>
            )}
            <Button
              mt="md"
              size="sm"
              variant="light"
              color={result.success ? 'green' : 'red'}
              onClick={() => {
                setResult(null);
                if (result.success && onSuccess) {
                  onSuccess();
                }
              }}
            >
              OK
            </Button>
          </Alert>
        )}
      </Stack>

      {/* 上書き確認ダイアログ */}
      <Modal
        opened={showOverwriteConfirm}
        onClose={handleOverwriteCancel}
        title="アーカイブ上書き確認"
        size="md"
        centered
        closeOnClickOutside={false}
        withCloseButton={false}
      >
        <Stack gap="md">
          <Alert color="yellow" title="警告">
            このアーカイブは既に存在します。上書きすると既存のデータが完全に削除されます。
          </Alert>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleOverwriteCancel}>
              キャンセル
            </Button>
            <Button color="red" onClick={handleOverwriteConfirm} loading={loading}>
              上書きする
            </Button>
          </Group>
        </Stack>
      </Modal>
    </form>
  );
}

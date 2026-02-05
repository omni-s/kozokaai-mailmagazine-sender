'use client';

import { useState, useCallback } from 'react';
import { Stepper, Container, Paper } from '@mantine/core';
import { parseCSV, analyzeColumns, toPropertyKey, type ColumnAnalysis } from '@/lib/csv-parser';
import type { PropertyConfig, ImportCompleteEvent, ColumnAnalysisJson } from '@/lib/import-contacts-schema';
import { UploadStep } from './steps/UploadStep';
import { PreviewStep } from './steps/PreviewStep';
import { PropertyConfigStep } from './steps/PropertyConfigStep';
import { SegmentStep } from './steps/SegmentStep';
import { ExecuteStep } from './steps/ExecuteStep';
import { ResultStep } from './steps/ResultStep';

/**
 * CSV コンタクトインポート ウィザード
 *
 * Mantine Stepper を使用したウィザード形式の UI
 */
export function ImportWizard() {
  const [active, setActive] = useState(0);

  // Step 2: プレビュー
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [columnAnalysis, setColumnAnalysis] = useState<ColumnAnalysis | null>(null);

  // Step 3: プロパティ設定
  const [propertyConfigs, setPropertyConfigs] = useState<PropertyConfig[]>([]);

  // Step 4: Audience 選択
  const [audienceId, setAudienceId] = useState<string>('');

  // Step 5-6: 実行結果
  const [importResult, setImportResult] = useState<ImportCompleteEvent | null>(null);

  // CSV ファイル読み込み
  const handleFileUpload = useCallback((content: string) => {
    try {
      const parsed = parseCSV(content);
      setRecords(parsed);

      if (parsed.length > 0) {
        const headers = Object.keys(parsed[0]);
        const analysis = analyzeColumns(headers);
        setColumnAnalysis(analysis);

        // カスタムプロパティの初期設定を生成
        const initialConfigs: PropertyConfig[] = analysis.custom.map((col) => ({
          columnName: col,
          key: toPropertyKey(col),
          type: 'string' as const,
          fallbackValue: '未設定',
        }));
        setPropertyConfigs(initialConfigs);
      }

      setActive(1);
    } catch (err) {
      console.error('CSV parse error:', err);
      alert(`CSVパースエラー: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  // プレビュー確認 → プロパティ設定
  const handlePreviewConfirm = useCallback(() => {
    if (columnAnalysis?.custom && columnAnalysis.custom.length > 0) {
      setActive(2);
    } else {
      setActive(3);
    }
  }, [columnAnalysis]);

  // プロパティ設定変更
  const handlePropertyConfigChange = useCallback((configs: PropertyConfig[]) => {
    setPropertyConfigs(configs);
  }, []);

  // プロパティ設定確認 → Audience 選択
  const handlePropertyConfirm = useCallback(() => {
    setActive(3);
  }, []);

  // Audience 選択変更
  const handleAudienceChange = useCallback((id: string) => {
    setAudienceId(id);
  }, []);

  // Audience 選択確認 → 実行
  const handleAudienceConfirm = useCallback(() => {
    setActive(4);
  }, []);

  // インポート完了
  const handleImportComplete = useCallback((result: ImportCompleteEvent) => {
    setImportResult(result);
    setActive(5);
  }, []);

  // 失敗分のみ再インポート
  const handleRetryFailed = useCallback(() => {
    if (!importResult || !columnAnalysis) return;
    const failedEmails = new Set(importResult.failures.map(f => f.email));
    const emailCol = columnAnalysis.emailColumn;
    if (!emailCol) return;
    const filteredRecords = records.filter(r => failedEmails.has(r[emailCol]?.trim()));
    setRecords(filteredRecords);
    setImportResult(null);
    setActive(4);
  }, [importResult, columnAnalysis, records]);

  // 最初からやり直す
  const handleReset = useCallback(() => {
    setRecords([]);
    setColumnAnalysis(null);
    setPropertyConfigs([]);
    setAudienceId('');
    setImportResult(null);
    setActive(0);
  }, []);

  // 戻るボタン
  const handleBack = useCallback(() => {
    if (active === 3 && columnAnalysis?.custom && columnAnalysis.custom.length === 0) {
      setActive(1);
    } else {
      setActive((prev) => Math.max(0, prev - 1));
    }
  }, [active, columnAnalysis]);

  // ColumnAnalysis を JSON 用に変換
  const columnAnalysisJson: ColumnAnalysisJson | null = columnAnalysis
    ? {
        standard: Array.from(columnAnalysis.standard.entries()),
        custom: columnAnalysis.custom,
        emailColumn: columnAnalysis.emailColumn,
      }
    : null;

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Stepper
          active={active}
          onStepClick={(step) => {
            if (step < active) {
              setActive(step);
            }
          }}
          mb="xl"
          allowNextStepsSelect={false}
        >
          <Stepper.Step label="アップロード" description="CSVファイル選択">
            <UploadStep onUpload={handleFileUpload} />
          </Stepper.Step>

          <Stepper.Step label="プレビュー" description="データ確認">
            <PreviewStep
              records={records}
              columnAnalysis={columnAnalysis}
              onConfirm={handlePreviewConfirm}
              onBack={handleBack}
            />
          </Stepper.Step>

          <Stepper.Step label="プロパティ設定" description="型・fallback値">
            <PropertyConfigStep
              records={records}
              columnAnalysis={columnAnalysis}
              propertyConfigs={propertyConfigs}
              onChange={handlePropertyConfigChange}
              onConfirm={handlePropertyConfirm}
              onBack={handleBack}
            />
          </Stepper.Step>

          <Stepper.Step label="Segment選択" description="インポート先">
            <SegmentStep
              audienceId={audienceId}
              onChange={handleAudienceChange}
              onConfirm={handleAudienceConfirm}
              onBack={handleBack}
            />
          </Stepper.Step>

          <Stepper.Step label="実行" description="インポート中">
            <ExecuteStep
              records={records}
              audienceId={audienceId}
              propertyConfigs={propertyConfigs}
              columnAnalysis={columnAnalysisJson}
              onComplete={handleImportComplete}
              onBack={handleBack}
            />
          </Stepper.Step>

          <Stepper.Completed>
            <ResultStep result={importResult} onReset={handleReset} onRetryFailed={handleRetryFailed} />
          </Stepper.Completed>
        </Stepper>
      </Paper>
    </Container>
  );
}

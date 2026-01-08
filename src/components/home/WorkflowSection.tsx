import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Divider } from '@mantine/core';

export function WorkflowSection() {
  return (
    <div className="space-y-6">
      {/* 使い方セクション */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">使い方</Badge>
        </div>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              1
            </span>
            <span>
              <Link href="/draft" className="font-medium text-primary hover:underline">
                メール編集画面
              </Link>
              でメールをデザイン
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              2
            </span>
            <span>
              画像は <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">public/mail-assets/</code> に配置
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              3
            </span>
            <span>
              完成したら <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">pnpm run commit</code> を実行
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              4
            </span>
            <span>PR作成 → レビュー → マージで本番配信</span>
          </li>
        </ol>
      </div>

      <Divider />

      {/* ワークフローセクション */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">ワークフロー</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-semibold text-primary">1</span>
            </div>
            <h3 className="font-medium">ローカル制作</h3>
            <p className="text-sm text-muted-foreground">
              メールをデザイン → pnpm run commit
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-semibold text-primary">2</span>
            </div>
            <h3 className="font-medium">レビュー</h3>
            <p className="text-sm text-muted-foreground">
              PR作成 → テストメール確認
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-semibold text-primary">3</span>
            </div>
            <h3 className="font-medium">配信</h3>
            <p className="text-sm text-muted-foreground">
              マージ → 承認 → 本番送信
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

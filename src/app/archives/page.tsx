import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getArchiveList } from '@/lib/archive-loader';
import { ArchiveListClient } from './ArchiveListClient';

export const metadata = {
  title: 'メール配信履歴 | Resend メール配信システム',
  description: '過去に送信したメールマガジンの一覧',
};

export default async function ArchivesPage() {
  const archives = await getArchiveList();

  return (
    <div className="container max-w-6xl py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">メール配信履歴</h1>
          <p className="text-muted-foreground mt-2">
            過去に送信したメールマガジン {archives.length}件
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">ホームへ戻る</Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="text-center py-12 text-muted-foreground">
            読み込み中...
          </div>
        }
      >
        {archives.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            メールアーカイブが見つかりませんでした
          </div>
        ) : (
          <ArchiveListClient archives={archives} />
        )}
      </Suspense>
    </div>
  );
}

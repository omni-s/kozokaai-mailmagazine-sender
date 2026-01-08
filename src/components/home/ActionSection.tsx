import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ActionSection() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild size="lg">
        <Link href="/draft">メール編集画面へ</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/archives">配信履歴を見る</Link>
      </Button>
      <Button asChild size="lg" variant="ghost">
        <a
          href="https://github.com/anthropics/claude-code"
          target="_blank"
          rel="noopener noreferrer"
        >
          ドキュメント
        </a>
      </Button>
    </div>
  );
}

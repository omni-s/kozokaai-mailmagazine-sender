import Link from 'next/link';
import { Button } from '@mantine/core';

export function ActionSection() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button component={Link} href="/draft" size="lg">
        メール編集画面へ
      </Button>
      <Button component={Link} href="/archives" size="lg" variant="outline">
        配信履歴を見る
      </Button>
      <Button
        component="a"
        href="https://github.com/anthropics/claude-code"
        target="_blank"
        rel="noopener noreferrer"
        size="lg"
        variant="subtle"
      >
        ドキュメント
      </Button>
    </div>
  );
}

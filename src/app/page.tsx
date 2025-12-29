import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl">
            Resend メール配信システム
          </CardTitle>
          <CardDescription>
            メールマガジンをデザイン・配信するためのシステムです。
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h2 className="text-lg font-semibold mb-3">使い方</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>
                <Link
                  href="/draft"
                  className="text-blue-600 hover:underline font-medium"
                >
                  メール編集画面
                </Link>
                でメールをデザイン
              </li>
              <li>
                画像は <code className="bg-gray-200 px-1 rounded">public/mail-assets/</code> に配置
              </li>
              <li>
                完成したら <code className="bg-gray-200 px-1 rounded">pnpm run commit</code> を実行
              </li>
              <li>PRを作成して上長にレビュー依頼 → マージで本番配信</li>
            </ol>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <h3 className="text-md font-semibold mb-2">ワークフロー</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-medium">1. ローカル制作:</span>
                <span>メールをデザイン → pnpm run commit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">2. レビュー:</span>
                <span>PR作成 → テストメール確認</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">3. 配信:</span>
                <span>マージ → 承認 → 本番送信</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Link href="/draft">
            <Button size="lg">メール編集画面へ</Button>
          </Link>
          <a
            href="https://github.com/anthropics/claude-code"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-transparent hover:bg-gray-100 h-11 px-8"
          >
            ドキュメント
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}

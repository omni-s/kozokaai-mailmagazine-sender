import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';

// 画像パス置換関数
function replaceImagePaths(
  html: string,
  s3BaseUrl: string,
  yyyy: string,
  mm: string,
  ddMsg: string
): string {
  const pattern = /<img[^>]*src=['"]\/mail-assets\/([^'"]+)['"]/gi;
  return html.replace(pattern, (match, filename) => {
    const s3Url = `${s3BaseUrl}/archives/${yyyy}/${mm}/${ddMsg}/assets/${filename}`;
    return match.replace(/\/mail-assets\/[^'"]+/, s3Url);
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ yyyy: string; mm: string; ddMsg: string }> }
) {
  try {
    const { yyyy, mm, ddMsg } = await params;

    // HTMLファイルを直接読み込み（mail.html は pnpm run commit 時に生成済み）
    const htmlPath = path.join(process.cwd(), 'src', 'archives', yyyy, mm, ddMsg, 'mail.html');

    if (!fs.existsSync(htmlPath)) {
      return NextResponse.json(
        { error: 'mail.html が見つかりません。pnpm run commit を実行してアーカイブを作成してください。' },
        { status: 404 }
      );
    }

    let html = fs.readFileSync(htmlPath, 'utf-8');

    // 画像パス置換（S3 URL）
    const s3BaseUrl = process.env.S3_BUCKET_URL;
    if (s3BaseUrl) {
      html = replaceImagePaths(html, s3BaseUrl, yyyy, mm, ddMsg);
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1時間キャッシュ
      },
    });
  } catch (error) {
    console.error('Failed to render mail component:', error);
    return NextResponse.json(
      { error: 'メールのレンダリングに失敗しました' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * S3 Client初期化
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const S3_BASE_URL = process.env.S3_BUCKET_URL!;

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

    // URLエンコードされている可能性があるためデコード
    let decodedDdMsg: string;
    try {
      decodedDdMsg = decodeURIComponent(ddMsg);
    } catch {
      decodedDdMsg = ddMsg;
    }

    // S3からmail.htmlを取得
    const htmlKey = `archives/${yyyy}/${mm}/${decodedDdMsg}/mail.html`;
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: htmlKey,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: `mail.html が見つかりません: ${htmlKey}` },
        { status: 404 }
      );
    }

    let html = await response.Body.transformToString();

    // 画像パス置換（S3 URL）- URLエンコードしてブラウザからのアクセスを確保
    html = replaceImagePaths(html, S3_BASE_URL, yyyy, mm, encodeURIComponent(decodedDdMsg));

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1時間キャッシュ
      },
    });
  } catch (error) {
    console.error('Failed to render mail component from S3:', error);
    return NextResponse.json(
      { error: 'メールのレンダリングに失敗しました' },
      { status: 500 }
    );
  }
}

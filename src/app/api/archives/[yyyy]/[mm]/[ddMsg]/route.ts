import { NextRequest, NextResponse } from 'next/server';
import { deleteArchiveFromS3 } from '@/lib/s3';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ yyyy: string; mm: string; ddMsg: string }> }
) {
  try {
    const { yyyy, mm, ddMsg } = await params;

    // パスインジェクション対策: 年の形式検証
    if (!/^\d{4}$/.test(yyyy)) {
      return NextResponse.json({ error: '不正な年形式' }, { status: 400 });
    }

    // パスインジェクション対策: 月の形式検証
    if (!/^\d{2}$/.test(mm)) {
      return NextResponse.json({ error: '不正な月形式' }, { status: 400 });
    }

    // URLエンコードされている可能性があるためデコード
    let decodedDdMsg: string;
    try {
      decodedDdMsg = decodeURIComponent(ddMsg);
    } catch {
      decodedDdMsg = ddMsg;
    }

    // パスインジェクション対策: ディレクトリトラバーサル防止
    if (decodedDdMsg.includes('..') || decodedDdMsg.includes('/')) {
      return NextResponse.json({ error: '不正なパス' }, { status: 400 });
    }

    // S3からアーカイブを削除
    const archivePath = `${yyyy}/${mm}/${decodedDdMsg}`;
    await deleteArchiveFromS3(archivePath);

    return NextResponse.json({ success: true, message: 'アーカイブを削除しました' });
  } catch (error) {
    console.error('Archive delete error:', error);
    return NextResponse.json(
      { error: 'アーカイブの削除に失敗しました' },
      { status: 500 }
    );
  }
}

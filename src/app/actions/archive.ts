'use server';

import { revalidatePath } from 'next/cache';
import { deleteArchiveFromS3 } from '@/lib/s3';

/**
 * アーカイブを削除するServer Action
 *
 * Server Action内でrevalidatePath()を呼ぶことで、
 * Data Cache + Router Cache + Full Route Cacheを即座に無効化する。
 */
export async function deleteArchive(yyyy: string, mm: string, ddMsg: string) {
  // パスインジェクション対策: 年の形式検証
  if (!/^\d{4}$/.test(yyyy)) {
    throw new Error('不正な年形式');
  }

  // パスインジェクション対策: 月の形式検証
  if (!/^\d{2}$/.test(mm)) {
    throw new Error('不正な月形式');
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
    throw new Error('不正なパス');
  }

  const archivePath = `${yyyy}/${mm}/${decodedDdMsg}`;
  await deleteArchiveFromS3(archivePath);

  revalidatePath('/', 'layout');
}

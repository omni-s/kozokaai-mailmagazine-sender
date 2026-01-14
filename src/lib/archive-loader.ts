import * as fs from 'fs';
import * as path from 'path';
import { validateConfig } from './config-schema';

/**
 * メールアーカイブ情報
 */
export interface MailArchive {
  yyyy: string; // "2024"
  mm: string; // "05"
  ddMsg: string; // "20-summer-sale"
  subject: string;
  segmentId?: string; // UUID形式（推奨）
  audienceId?: string; // aud_xxx形式（非推奨、後方互換性のため残す）
  sentAt: string | null;
  path: string; // "2024/05/20-summer-sale"
  createdAt: Date;
}

/**
 * アーカイブ一覧を取得
 *
 * public/archives/ ディレクトリを再帰的に走査し、
 * 各アーカイブの config.json を読み込んでMailArchive[]を返却
 *
 * @returns MailArchive[] - 日付降順でソート済み
 */
export async function getArchiveList(): Promise<MailArchive[]> {
  const archivesDir = path.join(process.cwd(), 'src', 'archives');

  if (!fs.existsSync(archivesDir)) {
    return [];
  }

  const archives: MailArchive[] = [];

  // YYYY → MM → DD-MSG の3階層走査
  const years = fs
    .readdirSync(archivesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const yearDirent of years) {
    const yyyy = yearDirent.name;
    const yearDir = path.join(archivesDir, yyyy);

    const months = fs
      .readdirSync(yearDir, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    for (const monthDirent of months) {
      const mm = monthDirent.name;
      const monthDir = path.join(yearDir, mm);

      const days = fs
        .readdirSync(monthDir, { withFileTypes: true })
        .filter((d) => d.isDirectory());

      for (const dayDirent of days) {
        const ddMsg = dayDirent.name;
        const archiveDir = path.join(monthDir, ddMsg);
        const configPath = path.join(archiveDir, 'config.json');

        if (!fs.existsSync(configPath)) {
          console.warn(`config.json not found: ${archiveDir}`);
          continue;
        }

        try {
          const configContent = fs.readFileSync(configPath, 'utf-8');
          const configData = JSON.parse(configContent);
          const result = validateConfig(configData);

          if (!result.success) {
            console.warn(`Invalid config.json: ${archiveDir}`);
            continue;
          }

          const config = result.data!;
          const stats = fs.statSync(archiveDir);

          archives.push({
            yyyy,
            mm,
            ddMsg,
            subject: config.subject,
            segmentId: config.segmentId,
            audienceId: config.audienceId,
            sentAt: config.sentAt,
            path: `${yyyy}/${mm}/${ddMsg}`,
            createdAt: stats.birthtime,
          });
        } catch (error) {
          console.warn(`Failed to load archive: ${archiveDir}`, error);
        }
      }
    }
  }

  // 日付降順ソート（送信日優先、未送信は作成日でソート）
  archives.sort((a, b) => {
    const aDate = a.sentAt ? new Date(a.sentAt) : a.createdAt;
    const bDate = b.sentAt ? new Date(b.sentAt) : b.createdAt;
    return bDate.getTime() - aDate.getTime();
  });

  return archives;
}

/**
 * 特定のアーカイブを取得
 *
 * @param yyyy - 年（4桁の数字）
 * @param mm - 月（2桁の数字）
 * @param ddMsg - 日付とメッセージ名（DD-MSG 形式）
 * @returns MailArchive | null
 */
export async function getArchive(
  yyyy: string,
  mm: string,
  ddMsg: string
): Promise<MailArchive | null> {
  // パスインジェクション対策
  if (!/^\d{4}$/.test(yyyy)) return null;
  if (!/^\d{2}$/.test(mm)) return null;
  if (!/^[\w-]+$/.test(ddMsg)) return null;

  const archiveDir = path.join(
    process.cwd(),
    'src',
    'archives',
    yyyy,
    mm,
    ddMsg
  );
  const configPath = path.join(archiveDir, 'config.json');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const configData = JSON.parse(configContent);
    const result = validateConfig(configData);

    if (!result.success) {
      return null;
    }

    const config = result.data!;
    const stats = fs.statSync(archiveDir);

    return {
      yyyy,
      mm,
      ddMsg,
      subject: config.subject,
      audienceId: config.audienceId,
      sentAt: config.sentAt,
      path: `${yyyy}/${mm}/${ddMsg}`,
      createdAt: stats.birthtime,
    };
  } catch {
    return null;
  }
}

import { getArchiveList } from '@/lib/archive-loader';
import { Sidebar } from './Sidebar';

/**
 * SidebarWrapper - Server Component
 *
 * データ取得を担当し、Sidebar（Client Component）にデータを渡します。
 * これにより、Client/Server Component の境界を明確化し、
 * fs モジュールのクライアント側での使用を防ぎます。
 */
export async function SidebarWrapper() {
  const archives = await getArchiveList();
  return <Sidebar archives={archives} />;
}

import { getArchiveList } from '@/lib/archive-loader';
import { ArchiveAccordion } from './ArchiveAccordion';

export async function ArchiveAccordionWrapper() {
  const archives = await getArchiveList();
  return <ArchiveAccordion archives={archives} />;
}

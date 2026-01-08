'use client';

import { useState, useMemo } from 'react';
import { ArchiveCard } from '@/components/archive/ArchiveCard';
import {
  ArchiveFilters,
  type FilterState,
} from '@/components/archive/ArchiveFilters';
import type { MailArchive } from '@/lib/archive-loader';

interface ArchiveListClientProps {
  archives: MailArchive[];
}

export function ArchiveListClient({ archives }: ArchiveListClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    sortOrder: 'desc',
  });

  const filteredArchives = useMemo(() => {
    const result = archives.filter((archive) => {
      if (
        filters.search &&
        !archive.subject.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      if (filters.status === 'sent' && !archive.sentAt) return false;
      if (filters.status === 'unsent' && archive.sentAt) return false;

      return true;
    });

    result.sort((a, b) => {
      const aDate = a.sentAt ? new Date(a.sentAt) : a.createdAt;
      const bDate = b.sentAt ? new Date(b.sentAt) : b.createdAt;
      return filters.sortOrder === 'desc'
        ? bDate.getTime() - aDate.getTime()
        : aDate.getTime() - bDate.getTime();
    });

    return result;
  }, [archives, filters]);

  return (
    <>
      <ArchiveFilters onFilterChange={setFilters} />

      <div className="space-y-4">
        {filteredArchives.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            該当するメールが見つかりませんでした
          </div>
        ) : (
          filteredArchives.map((archive) => (
            <ArchiveCard key={archive.path} archive={archive} />
          ))
        )}
      </div>
    </>
  );
}

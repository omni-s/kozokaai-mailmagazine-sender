'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { MailArchive } from '@/lib/archive-loader';

export interface ArchiveAccordionState {
  expandedYears: string[];
  expandedMonths: string[];
  toggleYear: (year: string) => void;
  toggleMonth: (yearMonth: string) => void;
  expandForSearch: (archives: MailArchive[]) => void;
}

/**
 * アーカイブアコーディオンの展開状態を管理するフック。
 * AppShellLayoutレベルで呼び出すことで、ページ遷移をまたいで状態を永続化する。
 * 現在のパスに該当する年・月を自動的に展開する。
 */
export function useArchiveAccordionState(): ArchiveAccordionState {
  const [expandedYears, setExpandedYears] = useState<string[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const pathname = usePathname();

  // パスから yyyy/mm を抽出して自動展開
  useEffect(() => {
    const match = pathname.match(/^\/archives\/(\d{4})\/(\d{2})\//);
    if (!match) return;

    const [, yyyy, mm] = match;
    const yearMonth = `${yyyy}-${mm}`;

    setExpandedYears(prev =>
      prev.includes(yyyy) ? prev : [...prev, yyyy]
    );
    setExpandedMonths(prev =>
      prev.includes(yearMonth) ? prev : [...prev, yearMonth]
    );
  }, [pathname]);

  const toggleYear = useCallback((year: string) => {
    setExpandedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  }, []);

  const toggleMonth = useCallback((yearMonth: string) => {
    setExpandedMonths(prev =>
      prev.includes(yearMonth)
        ? prev.filter(ym => ym !== yearMonth)
        : [...prev, yearMonth]
    );
  }, []);

  // 検索結果に含まれるアーカイブの年・月をすべて展開する
  const expandForSearch = useCallback((archives: MailArchive[]) => {
    const years = new Set<string>();
    const months = new Set<string>();

    archives.forEach(a => {
      years.add(a.yyyy);
      months.add(`${a.yyyy}-${a.mm}`);
    });

    setExpandedYears(Array.from(years));
    setExpandedMonths(Array.from(months));
  }, []);

  return {
    expandedYears,
    expandedMonths,
    toggleYear,
    toggleMonth,
    expandForSearch,
  };
}

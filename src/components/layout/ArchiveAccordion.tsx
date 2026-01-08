'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MailArchive } from '@/lib/archive-loader';

interface GroupedArchive {
  year: string;
  months: {
    month: string;
    archives: MailArchive[];
  }[];
}

interface ArchiveAccordionProps {
  archives: MailArchive[];
}

const groupArchivesByYearMonth = (archives: MailArchive[]): GroupedArchive[] => {
  const grouped = new Map<string, Map<string, MailArchive[]>>();

  archives.forEach(archive => {
    if (!grouped.has(archive.yyyy)) {
      grouped.set(archive.yyyy, new Map());
    }
    const yearMap = grouped.get(archive.yyyy)!;
    if (!yearMap.has(archive.mm)) {
      yearMap.set(archive.mm, []);
    }
    yearMap.get(archive.mm)!.push(archive);
  });

  return Array.from(grouped.entries())
    .map(([year, months]) => ({
      year,
      months: Array.from(months.entries()).map(([month, archives]) => ({
        month,
        archives,
      })),
    }))
    .sort((a, b) => b.year.localeCompare(a.year));
};

export function ArchiveAccordion({ archives }: ArchiveAccordionProps) {
  const [expandedYears, setExpandedYears] = useState<string[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  const groupedArchives = useMemo(() => groupArchivesByYearMonth(archives), [archives]);

  const toggleYear = (year: string) => {
    setExpandedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const toggleMonth = (yearMonth: string) => {
    setExpandedMonths(prev =>
      prev.includes(yearMonth) ? prev.filter(ym => ym !== yearMonth) : [...prev, yearMonth]
    );
  };

  if (archives.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-gray-500">
        配信履歴はありません
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groupedArchives.map(({ year, months }) => {
        const isYearExpanded = expandedYears.includes(year);

        return (
          <div key={year}>
            <button
              onClick={() => toggleYear(year)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 rounded-md transition-colors"
              aria-expanded={isYearExpanded}
              aria-controls={`year-${year}-content`}
            >
              <span>{year}年</span>
              {isYearExpanded ? (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {isYearExpanded && (
              <div
                id={`year-${year}-content`}
                className="ml-2 mt-1 space-y-1"
              >
                {months.map(({ month, archives: monthArchives }) => {
                  const yearMonth = `${year}-${month}`;
                  const isMonthExpanded = expandedMonths.includes(yearMonth);

                  return (
                    <div key={yearMonth}>
                      <button
                        onClick={() => toggleMonth(yearMonth)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
                        aria-expanded={isMonthExpanded}
                        aria-controls={`month-${yearMonth}-content`}
                      >
                        <span>{Number(month)}月</span>
                        {isMonthExpanded ? (
                          <ChevronDown className="w-3 h-3" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="w-3 h-3" aria-hidden="true" />
                        )}
                      </button>

                      {isMonthExpanded && (
                        <div
                          id={`month-${yearMonth}-content`}
                          className="ml-2 mt-1 space-y-0.5"
                        >
                          {monthArchives.map((archive) => (
                            <Link
                              key={archive.path}
                              href={`/archives/${archive.yyyy}/${archive.mm}/${archive.ddMsg}`}
                              className="flex items-start gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{archive.subject}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={archive.sentAt ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {archive.sentAt ? '送信済み' : '未送信'}
                                  </Badge>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

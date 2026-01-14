'use client';

import { useState, useMemo } from 'react';
import { NavLink, Badge, Collapse, Button, Box, Text, Group } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
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
      <Box px="sm" py="md">
        <Text size="sm" c="dimmed">
          配信履歴はありません
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      {groupedArchives.map(({ year, months }) => {
        const isYearExpanded = expandedYears.includes(year);

        return (
          <Box key={year} mb="xs">
            <Button
              variant="subtle"
              fullWidth
              justify="space-between"
              onClick={() => toggleYear(year)}
              rightSection={
                isYearExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />
              }
              aria-expanded={isYearExpanded}
              aria-controls={`year-${year}-content`}
            >
              {year}年
            </Button>

            <Collapse in={isYearExpanded}>
              <Box pl="sm" mt="xs" id={`year-${year}-content`}>
                {months.map(({ month, archives: monthArchives }) => {
                  const yearMonth = `${year}-${month}`;
                  const isMonthExpanded = expandedMonths.includes(yearMonth);

                  return (
                    <Box key={yearMonth} mb="xs">
                      <Button
                        variant="subtle"
                        fullWidth
                        justify="space-between"
                        size="sm"
                        onClick={() => toggleMonth(yearMonth)}
                        rightSection={
                          isMonthExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />
                        }
                        aria-expanded={isMonthExpanded}
                        aria-controls={`month-${yearMonth}-content`}
                      >
                        {Number(month)}月
                      </Button>

                      <Collapse in={isMonthExpanded}>
                        <Box pl="sm" mt="xs" id={`month-${yearMonth}-content`}>
                          {monthArchives.map((archive) => (
                            <NavLink
                              key={archive.path}
                              href={`/archives/${archive.yyyy}/${archive.mm}/${archive.ddMsg}`}
                              label={
                                <Box>
                                  <Text size="xs" lineClamp={1}>{archive.subject}</Text>
                                  <Group gap="xs" mt={4}>
                                    <Badge
                                      variant={archive.sentAt ? 'filled' : 'light'}
                                      size="xs"
                                    >
                                      {archive.sentAt ? '送信済み' : '未送信'}
                                    </Badge>
                                  </Group>
                                </Box>
                              }
                            />
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
}

'use client';

import { useState } from 'react';
import { TextInput, Button, Group, Stack } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export interface FilterState {
  search: string;
  status: 'all' | 'sent' | 'unsent';
  sortOrder: 'desc' | 'asc';
}

interface ArchiveFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export function ArchiveFilters({ onFilterChange }: ArchiveFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    sortOrder: 'desc',
  });

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusChange = (status: FilterState['status']) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortOrderChange = (sortOrder: FilterState['sortOrder']) => {
    const newFilters = { ...filters, sortOrder };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <Stack gap="md" mb="xl">
      <TextInput
        placeholder="件名で検索..."
        value={filters.search}
        onChange={(e) => handleSearchChange(e.target.value)}
        leftSection={<IconSearch size={16} />}
        style={{ maxWidth: 400 }}
      />
      <Group gap="md">
        <Group gap="xs">
          <Button
            variant={filters.status === 'all' ? 'filled' : 'outline'}
            onClick={() => handleStatusChange('all')}
            size="sm"
          >
            すべて
          </Button>
          <Button
            variant={filters.status === 'sent' ? 'filled' : 'outline'}
            onClick={() => handleStatusChange('sent')}
            size="sm"
          >
            送信済み
          </Button>
          <Button
            variant={filters.status === 'unsent' ? 'filled' : 'outline'}
            onClick={() => handleStatusChange('unsent')}
            size="sm"
          >
            未送信
          </Button>
        </Group>
        <Group gap="xs">
          <Button
            variant={filters.sortOrder === 'desc' ? 'filled' : 'outline'}
            onClick={() => handleSortOrderChange('desc')}
            size="sm"
          >
            最新順
          </Button>
          <Button
            variant={filters.sortOrder === 'asc' ? 'filled' : 'outline'}
            onClick={() => handleSortOrderChange('asc')}
            size="sm"
          >
            古い順
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}

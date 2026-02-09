'use client';

import { Table, ScrollArea, Text } from '@mantine/core';

interface CsvPreviewTableProps {
  records: Record<string, string>[];
}

/**
 * CSV プレビューテーブル
 *
 * 先頭10件程度のレコードを表示する
 */
export function CsvPreviewTable({ records }: CsvPreviewTableProps) {
  if (records.length === 0) {
    return <Text c="dimmed">データがありません。</Text>;
  }

  const headers = Object.keys(records[0]);

  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            {headers.map((header) => (
              <Table.Th key={header} style={{ whiteSpace: 'nowrap' }}>
                {header}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {records.map((record, index) => (
            <Table.Tr key={index}>
              {headers.map((header) => (
                <Table.Td
                  key={header}
                  style={{
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={record[header]}
                >
                  {record[header] || ''}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

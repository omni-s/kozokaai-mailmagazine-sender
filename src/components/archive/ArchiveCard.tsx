'use client';

import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MailArchive } from '@/lib/archive-loader';

interface ArchiveCardProps {
  archive: MailArchive;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ArchiveCard({ archive }: ArchiveCardProps) {
  const isSent = archive.sentAt !== null;

  return (
    <Link href={`/archives/${archive.path}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg flex-1">{archive.subject}</CardTitle>
            <Badge variant={isSent ? 'default' : 'secondary'}>
              {isSent ? '送信済み' : '未送信'}
            </Badge>
          </div>
          <CardDescription>
            作成日: {formatDate(archive.createdAt)}
            {isSent && archive.sentAt && (
              <> / 送信日: {formatDate(archive.sentAt)}</>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

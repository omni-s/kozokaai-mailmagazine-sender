import { NextResponse } from 'next/server';
import { listSegments } from '@/lib/resend';

/**
 * GET /api/import-contacts/segments
 *
 * Resend Segment 一覧を返却する
 */
export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const segments = await listSegments();

    return NextResponse.json({
      segments: segments.map((segment) => ({
        id: segment.id,
        name: segment.name,
        createdAt: segment.created_at,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

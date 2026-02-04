import { NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * GET /api/import-contacts/audiences
 *
 * Resend Audience 一覧を返却する
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
    const resend = new Resend(apiKey);
    const { data, error } = await resend.audiences.list();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const audiences = data?.data || [];

    return NextResponse.json({
      audiences: audiences.map((audience) => ({
        id: audience.id,
        name: audience.name,
        createdAt: audience.created_at,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

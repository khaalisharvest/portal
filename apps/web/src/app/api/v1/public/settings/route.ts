import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/public/settings`, {
      next: { revalidate: 60 }, // cache for 60s
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch public settings' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';

const sampleResponse = () => ({
  message: 'Test API reachable',
  timestamp: new Date().toISOString(),
  metadata: {
    origin: 'manual-next-scaffold',
    environment: process.env.NODE_ENV || 'development',
    endpoints: ['/api/test'],
  },
  data: {
    items: [
      { id: 1, label: 'First item', active: true },
      { id: 2, label: 'Second item', active: false },
    ],
  },
});

export async function GET() {
  return NextResponse.json(sampleResponse());
}

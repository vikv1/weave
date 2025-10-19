import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = 'nodejs';

const s3 = new S3Client({
  region: 'us-east-1',
});

export async function GET(req: NextRequest) {
  // const userId = new URL(req.url).searchParams.get('userId');
  const userId = '1';
  const Bucket = process.env.S3_BUCKET_NAME || 'haha';
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  try {
    const list = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: `${userId}/` }));
    const contents = list.Contents ?? [];

    const items = await Promise.all(
      contents
        .filter((o) => !!o.Key)
        .map(async (o) => ({
          key: o.Key as string,
          fileName: (o.Key as string).replace(`${userId}/`, ''),
          url: await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: o.Key as string }), { expiresIn: 900 }),
        }))
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: 'List failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const Bucket = process.env.S3_BUCKET_NAME;
  const lambdaEndpoint = process.env.LAMBDA_PRESIGN_ENDPOINT || 'haha';

  try {
    const { userId, fileName, contentType } = (await req.json()) as {
      userId?: string; fileName?: string; contentType?: string;
    };
    if (!userId || !fileName) return NextResponse.json({ error: 'Missing userId or fileName' }, { status: 400 });

    const key = `${userId}/${fileName}`;

    const r = await fetch(lambdaEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        bucket: Bucket,
        key,
        method: 'PUT',
        contentType: contentType || 'application/octet-stream',
        expiresIn: 600,
      }),
    });

    if (!r.ok) return NextResponse.json({ error: 'Presign failed' }, { status: 502 });
    const data = await r.json();

    return NextResponse.json({ key, uploadUrl: data.url || data.uploadUrl });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
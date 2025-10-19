import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const s3 = new S3Client({
  region: 'us-east-1',
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  const Bucket = process.env.S3_BUCKET_NAME;
  if (error || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!Bucket) return NextResponse.json({ error: 'Missing S3_BUCKET_NAME env var' }, { status: 500 });

  try {
    const list = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: `${userId}/` }));
    const contents = list.Contents ?? [];

    const items = await Promise.all(
      contents
        .filter((o) => !!o.Key && !o.Key.endsWith('/'))
        .map(async (o) => {
          const key = o.Key as string;
          const fileName = key.replace(`${userId}/`, '');
          try {
            const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn: 900 });
            return { key, fileName, url, size: o.Size ?? null, lastModified: o.LastModified ? o.LastModified.toISOString() : null };
          } catch (e) {
            console.error('Presign failed:', key, e);
            return { key, fileName, url: null, size: o.Size ?? null, lastModified: o.LastModified ? o.LastModified.toISOString() : null } as any;
          }
        })
    );

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('List failed:', e);
    return NextResponse.json({ error: e?.message || 'List failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const lambdaEndpoint = process.env.LAMBDA_PRESIGN_ENDPOINT || 'hi dubhacks';

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    const authUserId = data?.user?.id;
    if (error || !authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileContent, fileType } = await req.json();
    
    if (!fileName || !fileContent) {
      return NextResponse.json({ error: 'Missing fileName or fileContent' }, { status: 400 });
    }

    const key = `${authUserId}/${fileName}`;

    const presign = await fetch(lambdaEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: fileName,
        uid: authUserId,
      }),
    });
    
    if (!presign.ok) {
      return NextResponse.json({ error: 'Presign failed' }, { status: 502 });
    }
    
    const { url: uploadUrl } = await presign.json();

    const base64Data = fileContent.replace(/^data:.+;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');
// Upload to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('S3 upload failed:', errorText);
      return NextResponse.json({ error: 'Upload failed' }, { status: 502 });
    }

    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
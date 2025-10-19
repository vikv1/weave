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
  const lambdaEndpoint = process.env.LAMBDA_PRESIGN_ENDPOINT || 'hi dubhacks';

  try {
    const { userId, fileName, fileContent, fileType } = await req.json();
    
    if (!userId || !fileName || !fileContent) {
      return NextResponse.json({ error: 'Missing userId, fileName, or fileContent' }, { status: 400 });
    }

    const key = `${userId}/${fileName}`;

    const presign = await fetch(lambdaEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: fileName,
        uid: userId,
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
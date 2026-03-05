import { NextResponse } from 'next/server';
import { HandleUploadBody, handleUpload } from '@vercel/blob/client';
import { auth } from '@clerk/nextjs/server';
import { MAX_FILE_SIZE } from '@/lib/constants';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN nao configurado.');
    }

    const jsonResponse = await handleUpload({
      token,
      body,
      request,
      onBeforeGenerateToken: async () => {
        const { userId } = await auth();

        if (!userId) {
          throw new Error('Acesso Negado: Usuario nao esta autenticado');
        }

        return {
          allowedContentTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_FILE_SIZE,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Ficheiro upado com blob', blob.url);

        const payload = tokenPayload ? JSON.parse(tokenPayload) : null;
        const userId = payload?.userId;

        if (!userId) {
          console.warn('Upload finalizado sem userId no token payload');
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido';
    const status = message.includes('Acesso Negado') ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

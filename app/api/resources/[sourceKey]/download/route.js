import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import canonicalCatalog from '@/knowledge/workbooks/canonical_sources.json';
import { createClient } from '@/lib/supabase/server';

const contentTypes = {
  '.csv': 'text/csv',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function safeDownloadName(source) {
  return path.basename(source.canonicalPath || source.title || 'bms-resource').replace(/["\r\n]/g, '');
}

function resolveSourcePath(source) {
  const workspaceRoot = process.cwd();
  const spreadsheetsRoot = path.resolve(workspaceRoot, 'Spreadsheets');
  const normalizedPath = String(source.canonicalPath || '').replace(/\\/g, '/');

  if (!normalizedPath.startsWith('Spreadsheets/')) {
    return null;
  }

  const sourcePath = path.resolve(workspaceRoot, 'Spreadsheets', normalizedPath.slice('Spreadsheets/'.length));

  if (!sourcePath.startsWith(`${spreadsheetsRoot}${path.sep}`)) {
    return null;
  }

  return sourcePath;
}

export async function GET(_request, { params }) {
  const { sourceKey } = await params;
  const source = (canonicalCatalog.sources || []).find((entry) => entry.key === sourceKey);

  if (!source) {
    return NextResponse.json({ ok: false, error: 'Resource not found.' }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  if (!source.access?.downloadAllowed) {
    return NextResponse.json({ ok: false, error: 'This source requires review before download.' }, { status: 403 });
  }

  const sourcePath = resolveSourcePath(source);
  if (!sourcePath) {
    return NextResponse.json({ ok: false, error: 'Invalid source path.' }, { status: 400 });
  }

  try {
    const file = await readFile(sourcePath);
    return new Response(file, {
      headers: {
        'Content-Type': contentTypes[source.extension] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeDownloadName(source)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Source file is not available on this server.' }, { status: 404 });
  }
}

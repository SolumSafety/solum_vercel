// POST /api/assessment/upload-evidence
// Accepts a single file upload linked to a specific question
// Stores in Supabase bucket: assessment-evidence
// Returns: { fileId, url, fileName, questionId }
//
// Form data fields:
//   file       — the file (image or document)
//   questionId — e.g. "GOV-001"
//   assessmentId — optional, if assessment already created
//   tier       — 2 or 3

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const ALLOWED_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file         = formData.get('file') as File | null;
    const questionId   = formData.get('questionId') as string;
    const assessmentId = formData.get('assessmentId') as string | null;
    const tier         = formData.get('tier') as string;

    if (!file)       return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!questionId) return NextResponse.json({ error: 'questionId required' }, { status: 400 });

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `File type not allowed: ${file.type}. Accepted: PDF, Word, Excel, JPEG, PNG, WebP`
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large — maximum 20MB' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Build storage path: assessment-evidence/tier{N}/{assessmentId or 'pending'}/{questionId}/{filename}
    const ext       = file.name.split('.').pop() || 'bin';
    const safeQId   = questionId.replace(/[^a-zA-Z0-9-]/g, '');
    const asmFolder = assessmentId || 'pending';
    const timestamp = Date.now();
    const storagePath = `tier${tier || '2'}/${asmFolder}/${safeQId}/${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data, error } = await supabase.storage
      .from('assessment-evidence')
      .upload(storagePath, buffer, {
        contentType:  file.type,
        upsert:       false,
        cacheControl: '3600',
      });

    if (error) {
      console.error('[Upload] Supabase storage error:', error);
      return NextResponse.json({ error: 'File upload failed — storage error' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('assessment-evidence')
      .getPublicUrl(storagePath);

    // Record in evidence_uploads table
    const { data: record } = await supabase
      .from('assessment_evidence')
      .insert({
        question_id:   questionId,
        assessment_id: assessmentId || null,
        tier:          parseInt(tier || '2'),
        file_name:     file.name,
        file_type:     file.type,
        file_size:     file.size,
        storage_path:  storagePath,
        public_url:    urlData?.publicUrl || null,
        upload_date:   new Date().toISOString(),
      })
      .select('id')
      .single();

    return NextResponse.json({
      fileId:      record?.id || storagePath,
      storagePath,
      url:         urlData?.publicUrl || null,
      fileName:    file.name,
      fileType:    file.type,
      questionId,
      assessmentId,
    });

  } catch (err) {
    console.error('[Upload] Unexpected error:', err);
    return NextResponse.json({ error: 'Upload failed — internal error' }, { status: 500 });
  }
}

// GET /api/assessment/upload-evidence?assessmentId=xxx
// Returns all evidence files for an assessment
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get('assessmentId');
  const questionId   = searchParams.get('questionId');

  if (!assessmentId && !questionId) {
    return NextResponse.json({ error: 'assessmentId or questionId required' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase.from('assessment_evidence').select('*');

  if (assessmentId) query = query.eq('assessment_id', assessmentId);
  if (questionId)   query = query.eq('question_id', questionId);

  const { data, error } = await query.order('upload_date', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 });

  return NextResponse.json({ files: data || [] });
}

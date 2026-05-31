// POST /api/assessment/submit
// Accepts full assessment responses for Tier 2 or Tier 3
// Calls Claude to generate all report sections automatically
// Stores assessment + report in Supabase
// Returns: { assessmentId, report, triggers, overallScore }

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import {
  getDomainsForTier, getOverallScore, getDomainScore,
  getTriggersFromResponses, ASSESSMENT_DOMAINS,
  type AssessmentDomain,
} from '@/lib/assessment-schema';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

// ── Rate limit: 1 assessment per 30 seconds per IP ──────────────────────────
const rateLimitMap = new Map<string, number>();

function buildSystemPrompt(tier: 2 | 3): string {
  const tierLabel = tier === 2 ? 'Tier 2 Standard Desktop' : 'Tier 3 Enterprise Field';
  const desktopNote = tier === 2
    ? '\n\nIMPORTANT — DESKTOP LIMITATION: All findings must be prefaced with "Based on documentation reviewed" or similar. Do NOT make field-verified claims. All recommendations must note "field verification recommended" for critical items.'
    : '';

  return `You are a senior WHS consultant at Solum Safety Consulting completing a ${tierLabel} WHS Gap Analysis Report.
You produce rigorous, legally-referenced, actionable WHS reports aligned to:
- Work Health and Safety Act 2011 (NSW)
- WHS Regulation 2025 (NSW) — commenced 22 August 2025
- Model Codes of Practice (Safe Work Australia)
- ISO 45001:2018
- AS/NZS Standards where applicable

Respond ONLY with valid JSON — no markdown, no preamble, no code blocks.${desktopNote}`;
}

function buildUserPrompt(
  tier: 2 | 3,
  orgInfo: Record<string, string>,
  responses: Record<string, number>,
  notes: Record<string, string>,
  evidenceLinks: Record<string, string[]>,
  domains: ReturnType<typeof getDomainsForTier>,
  overallScore: number,
  triggers: ReturnType<typeof getTriggersFromResponses>
): string {
  const domainSummaries = domains.map(d => ({
    id:      d.id,
    title:   d.title,
    iso:     d.isoClause,
    leg:     d.legislation,
    score:   getDomainScore(d.id, responses, tier)?.toFixed(1) || '0',
    questions: d.questions
      .filter(q => q.tier === 'both' || q.tier === tier)
      .map(q => ({
        id:       q.id,
        text:     q.text,
        score:    responses[q.id] || 0,
        notes:    notes[q.id] || '',
        evidence: evidenceLinks[q.id]?.length ? `${evidenceLinks[q.id].length} file(s) attached` : 'No evidence attached',
      }))
  }));

  const criticalTriggers = triggers.filter(t => t.risk === 'Critical');
  const highTriggers     = triggers.filter(t => t.risk === 'High');

  return `Complete a ${tier === 2 ? 'Tier 2 Standard Desktop' : 'Tier 3 Enterprise Field'} WHS Gap Analysis Report.

ORGANISATION:
${Object.entries(orgInfo).map(([k,v]) => `${k}: ${v}`).join('\n')}

ASSESSMENT RESULTS:
Overall Score: ${overallScore.toFixed(2)}/5.0
Critical Triggers: ${criticalTriggers.length} (${criticalTriggers.map(t=>t.flag).join(' | ') || 'none'})
High Triggers: ${highTriggers.length}

DOMAIN SCORES AND EVIDENCE:
${JSON.stringify(domainSummaries, null, 2)}

TRIGGERS FIRED:
${JSON.stringify(triggers, null, 2)}

Return ONLY this exact JSON structure:
{
  "executiveSummary": "3-4 sentences. Reference overall score, key strengths, critical gaps and regulatory exposure. ${tier === 2 ? 'Note this is a desktop assessment.' : ''}",
  "overallMaturityScore": ${overallScore.toFixed(1)},
  "overallMaturityLabel": "one of: Non-Compliant / Initial / Developing / Defined / Managed / Optimising",
  "assuranceStatement": "${tier === 3 ? '"Based on this Tier 3 Enterprise WHS Assurance Assessment, the WHS management system of [org] currently [does/does not] provide reasonable assurance that..." (2-3 sentences)' : '"Based on this Tier 2 Desktop WHS Gap Analysis, the documented WHS management systems reviewed for [org] indicate..." (2-3 sentences, note desktop limitation)'}",
  "keyStrengths": ["strength 1", "strength 2", "strength 3"],
  "criticalGaps": ["gap 1 with legislation ref", "gap 2", "gap 3"],
  "riskThemes": ["theme 1 — explain the pattern", "theme 2", "theme 3"],
  "domains": [
    {
      "id": "domain_id",
      "title": "Domain Title",
      "score": 2.4,
      "maturityLabel": "Developing",
      "priority": "Critical | High | Moderate | Low",
      "isoClause": "Cl. 6.1",
      "legislation": "WHS Act s.19",
      "overview": "2 sentences describing current state${tier === 2 ? ' — based on documentation reviewed' : ''}",
      "strengths": ["strength 1"],
      "gaps": ["gap 1 with specific legislation", "gap 2"],
      "findings": ["finding 1 — specific to question responses and notes", "finding 2"],
      "recommendations": ["specific actionable recommendation with legislation reference", "recommendation 2"]
    }
  ],
  "complianceGaps": [
    "specific compliance gap with WHS Act/Reg reference"
  ],
  "systemGaps": [
    "documented system that does not exist or is inadequate"
  ],
  "implementationGaps": [
    "system documented but not consistently applied${tier === 2 ? ' — note: field verification not conducted' : ''}"
  ],
  "legalCompliance": [
    {
      "area": "WHS Act s.27 Officer Due Diligence",
      "requirement": "Officers must exercise due diligence across 6 elements",
      "status": "Compliant | Partial | Gap Identified",
      "risk": "Critical | High | Moderate | Low",
      "legislation": "WHS Act 2011 s.27"
    }
  ],
  "actionPlan": [
    {
      "action": "specific action starting with a verb",
      "priority": "Critical | High | Moderate | Low",
      "domain": "domain title",
      "legislation": "WHS Act s.xx / WHS Reg r.xx / ISO 45001 Cl.xx",
      "owner": "WHS Manager | Senior Leadership | Operations",
      "due": "Immediate | 30 days | 60 days | 90 days",
      "output": "what document or system this action produces"
    }
  ],
  "roadmap": {
    "immediate": ["action 1", "action 2"],
    "medium": ["action 1", "action 2"],
    "longTerm": ["action 1", "action 2"]
  },
  "kpis": [
    ["KPI name", "target", "frequency", "owner"]
  ],
  "baselineStatement": "2-3 sentences establishing WHS maturity baseline for future measurement. Include score, date and recommendation for reassessment interval.",
  ${tier === 3 ? `"psychosocial": {
    "hazardsIdentified": [
      { "category": "High job demands", "specific": "specific observed hazard", "who": "exposed group", "likelihood": 3, "consequence": 3, "controls": "control action required", "responsible": "WHS Manager", "due": "30 days" }
    ],
    "controlHierarchy": {
      "elimination": {"status": "Applied | Partial | Not Applied", "note": "finding"},
      "substitution": {"status": "Applied | Partial | Not Applied", "note": "finding"},
      "redesign": {"status": "Applied | Partial | Not Applied", "note": "finding"},
      "administrative": {"status": "Applied | Partial | Not Applied", "note": "finding"},
      "support": {"status": "Applied | Partial | Not Applied", "note": "finding"}
    }
  },
  "officerDueDiligence": {
    "acquireKnowledge":    {"score": 2.5, "note": "specific finding from responses"},
    "understandOperations":{"score": 2.5, "note": "specific finding"},
    "ensureResources":     {"score": 2.5, "note": "specific finding"},
    "receiveInformation":  {"score": 2.5, "note": "specific finding"},
    "implementProcesses":  {"score": 2.5, "note": "specific finding"},
    "verifyCompliance":    {"score": 2.5, "note": "specific finding"}
  },
  "hsrStatus": {
    "dwgEstablished":     {"status": "Established | Not Established | Unknown", "note": "finding"},
    "hsrElected":         {"status": "Elected | Not Elected | Unknown",         "note": "finding"},
    "hsrTraining":        {"status": "Current | Overdue | Unknown",             "note": "finding"},
    "issueResolution":    {"status": "Documented | Not Documented | Unknown",   "note": "finding"},
    "hsrPowersRespected": {"status": "Evidenced | Unknown",                     "note": "finding"}
  },
  "notifiableStatus": {
    "definitionKnown":          {"status": "Compliant | Partial | Gap",  "note": "finding"},
    "incidentRegister":         {"status": "Compliant | Partial | Gap",  "note": "finding"},
    "scenePreservation":        {"status": "Compliant | Partial | Gap",  "note": "finding"},
    "regulatorNotification":    {"status": "Compliant | Partial | Gap",  "note": "finding"},
    "postIncidentInvestigation":{"status": "Compliant | Partial | Gap",  "note": "finding"}
  }` : ''}
}

Rules:
- Every finding must directly reference specific question scores and assessor notes provided
- Every recommendation must reference specific WHS Act/Reg section or ISO clause
- Action plan: order by priority — Critical first, then High, Moderate, Low
- Minimum 5 actions in action plan
- All gaps must be cross-referenced to the triggers fired
- ${tier === 2 ? 'All findings must note desktop limitation where field verification was not possible' : 'Include field observation data from evidence attachments in findings'}`;
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tier,        // 2 or 3
      orgInfo,     // { organisationName, jurisdiction, sector, departments, assessorName, ... }
      responses,   // { 'GOV-001': 3, 'GOV-002': 2, ... }
      notes,       // { 'GOV-001': 'assessor note text', ... }
      evidenceIds, // { 'GOV-001': ['uuid1', 'uuid2'], ... } — Supabase storage IDs
    } = body;

    if (!tier || ![2, 3].includes(tier)) {
      return NextResponse.json({ error: 'tier must be 2 or 3' }, { status: 400 });
    }
    if (!orgInfo?.organisationName) {
      return NextResponse.json({ error: 'orgInfo.organisationName is required' }, { status: 400 });
    }
    if (!responses || Object.keys(responses).length === 0) {
      return NextResponse.json({ error: 'No assessment responses provided' }, { status: 400 });
    }

    // Rate limit
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const lastCall = rateLimitMap.get(ip) || 0;
    if (Date.now() - lastCall < 30_000) {
      return NextResponse.json({ error: 'Rate limit — please wait 30 seconds between submissions' }, { status: 429 });
    }
    rateLimitMap.set(ip, Date.now());

    const supabase = createSupabaseAdminClient();

    // ── Resolve evidence file URLs ──────────────────────────────────────────
    const evidenceLinks: Record<string, string[]> = {};
    if (evidenceIds && Object.keys(evidenceIds).length > 0) {
      for (const [questionId, ids] of Object.entries(evidenceIds as Record<string, string[]>)) {
        const urls: string[] = [];
        for (const fileId of ids) {
          const { data } = supabase.storage.from('assessment-evidence').getPublicUrl(fileId);
          if (data?.publicUrl) urls.push(data.publicUrl);
        }
        evidenceLinks[questionId] = urls;
      }
    }

    // ── Calculate scores and triggers ──────────────────────────────────────
    const domains      = getDomainsForTier(tier as 2 | 3);
    const overallScore = getOverallScore(responses, tier as 2 | 3);
    const triggers     = getTriggersFromResponses(responses, tier as 2 | 3);

    const domainResults = domains.map(d => ({
      domain:        d.title,
      id:            d.id,
      score:         getDomainScore(d.id, responses, tier as 2 | 3) || 0,
      isoClause:     d.isoClause,
      regulationRef: d.legislation,
    }));

    // ── Call Claude to generate report ─────────────────────────────────────
    const claudeRes = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system:     buildSystemPrompt(tier as 2 | 3),
        messages: [{
          role: 'user',
          content: buildUserPrompt(
            tier as 2 | 3, orgInfo, responses, notes || {},
            evidenceLinks, domains, overallScore, triggers
          )
        }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('[Assessment] Claude API error:', err);
      return NextResponse.json({ error: 'Report generation failed — Claude API error' }, { status: 502 });
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || '';

    let report: Record<string, unknown>;
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      report = JSON.parse(cleaned);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error('[Assessment] Failed to parse Claude response:', rawText.slice(0, 500));
        return NextResponse.json({ error: 'Report parsing failed' }, { status: 500 });
      }
      report = JSON.parse(match[0]);
    }

    // Merge domain results and evidence links into report
    report.domainResults  = domainResults;
    report.triggers       = triggers;
    report.evidenceLinks  = evidenceLinks;
    report.organisationName = orgInfo.organisationName;
    report.orgInfo        = orgInfo;
    report.tier           = tier;
    report.assessmentDate = new Date().toISOString();
    report.generatedAt    = new Date().toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' });

    // ── Store in Supabase ───────────────────────────────────────────────────
    const { data: assessment, error: dbError } = await supabase
      .from('whs_assessments')
      .insert({
        tier,
        organisation_name:  orgInfo.organisationName,
        jurisdiction:       orgInfo.jurisdiction || 'NSW',
        sector:             orgInfo.sector || '',
        assessor:           orgInfo.assessorName || 'Solum Safety Consulting',
        overall_score:      overallScore,
        maturity_label:     report.overallMaturityLabel,
        critical_triggers:  triggers.filter(t => t.risk === 'Critical').length,
        high_triggers:      triggers.filter(t => t.risk === 'High').length,
        responses:          responses,
        assessor_notes:     notes || {},
        evidence_ids:       evidenceIds || {},
        report_json:        report,
        status:             'draft',
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[Assessment] Supabase insert error:', dbError);
      // Still return report even if DB fails
    }

    return NextResponse.json({
      assessmentId: assessment?.id || null,
      overallScore,
      maturityLabel: report.overallMaturityLabel,
      triggerCount: {
        critical: triggers.filter(t => t.risk === 'Critical').length,
        high:     triggers.filter(t => t.risk === 'High').length,
        moderate: triggers.filter(t => t.risk === 'Moderate').length,
      },
      triggers,
      domainResults,
      report,
    });

  } catch (err) {
    console.error('[Assessment] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

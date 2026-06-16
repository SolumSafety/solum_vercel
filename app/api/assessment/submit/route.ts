// POST /api/assessment/submit
// Accepts full assessment responses for Tier 2 or Tier 3
// Calls Claude to generate all report sections automatically
// Stores assessment + report in Supabase
// Returns: { assessmentId, report, triggers, overallScore }
//
// v2.1 — July 2026 (1 July 2026 regulatory updates)
//   - 0/1/2 scoring model with weighted category scores
//   - Psychosocial gate data (applicable/score/gaps/RTW)
//   - CoR gate data (applicable/score/items)
//   - Critical risk override in maturity label
//   - New maturity bands (Critical/Basic/Developing/Competent/Leading)
//   - Digital Work Systems Act 2026 (NSW) — PSY-007
//   - Expanded notifiable incidents (violence, extended absence ≥15 days, suicide)
//   - WEL replacing WES from 1 December 2026
//   - CoPs mandatory compliance benchmarks in NSW from 1 July 2026
//   - Updated Claude model string
//   - CoP benchmark rules in system prompt
//   - ISO 45001 Cl.8.4 bug removed (correct: Cl.8.1)
//   - EAP = Level 6 only rule enforced in system prompt

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import {
  getDomainsForTier,
  getWeightedOverallScore,
  getCategoryScores,
  getDomainScore,
  getTriggersFromResponses,
  getMaturityLabel,
  getBenchmarkPosition,
  type QuestionScore,
} from '@/lib/assessment-schema';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
// Updated to claude-sonnet-4-6 (current production model)
const CLAUDE_MODEL = 'claude-sonnet-4-6';

// ── Rate limit: 1 assessment per 30 seconds per IP ──────────────────────────
const rateLimitMap = new Map<string, number>();

function buildSystemPrompt(tier: 2 | 3): string {
  const tierLabel = tier === 2 ? 'Tier 2 Standard Desktop' : 'Tier 3 Enterprise Field';
  const desktopNote = tier === 2
    ? '\n\nDESKTOP LIMITATION: Prefix all findings with "Based on documentation reviewed" or "Based on desktop assessment of". Do NOT make field-verified claims. Recommend "field verification recommended" for all critical items.'
    : '';

  return `You are a senior WHS consultant at Solum Safety Consulting completing a ${tierLabel} WHS Gap Analysis Report.
You produce rigorous, legally-referenced, actionable WHS reports aligned to:
- Work Health and Safety Act 2011 (NSW)
- WHS Regulation 2025 (NSW) — commenced 22 August 2025
- All 39 NSW Codes of Practice approved under WHS Act 2011 s.274
- ISO 45001:2018
- AS/NZS Standards where applicable

SCORING MODEL (mandatory — apply to ALL reports):
- All scores are percentages (0–100%), NOT /5 ratings
- 0% = not in place | 50% = partially in place | 100% = fully in place
- Category scores are weighted: Compliance 10%, Risk Management 20%, Systems 15%, Training 10%, Consultation 10%, Incidents 10%, Contractor 10%, Psychosocial 10% (if applicable), CoR 5% (if applicable)
- Overall score = weighted average of applicable category scores
- CRITICAL RISK OVERRIDE: If any critical risk is identified, overall maturity rating is capped at "Basic" regardless of score

MATURITY BANDS (mandatory — use these exactly):
- 90–100%: Leading (🔵)
- 75–89%:  Competent (🟢)
- 60–74%:  Developing (🟡)
- 40–59%:  Basic (🟠)
- 0–39%:   Critical (🔴)
- Any critical risk + score ≥40%: "Basic (Critical Risk Override)"

PSYCHOSOCIAL MODULE (mandatory if psychosocialApplicable=true):
- EAP (Employee Assistance Program) is Level 6 — LAST RESORT ONLY. NEVER the primary or sole psychosocial control
- Prioritise SYSTEM-LEVEL causes (work design, workload, scheduling, leadership, digital systems) over individual outcomes
- DIGITAL WORK SYSTEMS (NEW 1 July 2026): Explicitly assess whether AI/algorithmic systems create psychosocial risks. This is a NEW mandatory obligation under the WHS Amendment (Digital Work Systems) Act 2026.
- Reference: Managing Psychosocial Hazards CoP (2021) | Sexual & Gender-Based Harassment CoP (June 2024) | Fatigue at Work CoP (February 2026) | WHS Amendment (Digital Work Systems) Act 2026
- If psychosocialApplicable=false: confirm in one sentence only — no further psychosocial content in report

CoR MODULE (mandatory if corApplicable=true):
- Officers face personal prosecution under HVNL s.26C–26I — include this reference
- CoR Risk Rating: 0–39% = High Legal Exposure | 40–69% = Medium | 70–100% = Low
- If corApplicable=false: confirm in one sentence only — no further CoR content

CoP BENCHMARK RULE (apply to every domain finding):
- Every finding MUST reference the applicable Code of Practice where one exists
- CRITICAL FROM 1 JULY 2026 (NSW): Codes of Practice are MANDATORY compliance benchmarks — not guidance. Non-compliance requires demonstrating an equivalent or higher standard (legal significance in prosecutions, coronial inquiries, and civil proceedings).
- Key CoPs: Risk Mgmt, Consultation (Feb 2022), Psychosocial (2021), Sexual Harassment (Jun 2024), Fatigue (Feb 2026), Silica/RCS (Feb 2026), Plant (2022), Tower Cranes (Jul 2025), Moving Plant (Dec 2025), Healthcare (Feb 2026)
REGULATORY ACCURACY RULES (mandatory — violations will fail QA):
- ISO 45001:2018 Clause 8.4 DOES NOT EXIST — contractor management = Cl.8.1. Never cite Cl.8.4.
- Psychosocial regulation: WHS Reg 2025 r.36 (mandatory 1 January 2025 in NSW).
- Digital Work Systems (NEW 1 July 2026): WHS Amendment (Digital Work Systems) Act 2026 (NSW) — PCBUs must ensure AI/algorithmic scheduling, automated performance monitoring, and app-based task allocation do not create WHS risks. Assess this under PSY-007.
- Incident Notification (EXPANDED from 1 July 2026): Now 6 categories — (1) death, (2) serious injury/illness, (3) dangerous incident, (4) violent incidents (incl. sexual assault), (5) notifiable extended absences (≥15 consecutive days), (6) notifiable suicides (work-related). Failure to notify = Category 2 offence.
- WEL: Workplace Exposure Limits replace Workplace Exposure Standards (WES) from 1 December 2026. Same 0.05 mg/m³ RCS numerical limit — update terminology in monitoring records, SWMS, and risk assessments.
- Silica Worker Register: WHS Reg 2025 Cl.430 (mandatory 1 October 2025).
- Training providers: WHS Reg 2025 r.39 (mandatory 1 January 2025).
- Lithium-ion Battery ERP: WHS Reg 2025 Cl.436 (mandatory where ≥25,000 kg stored).

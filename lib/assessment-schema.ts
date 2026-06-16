// ════════════════════════════════════════════════════════════════════════════
// SOLUM SAFETY CONSULTING — WHS ASSESSMENT SCHEMA  v2.0
// Updated June 2026: 0/1/2 scoring model | weighted categories
//   psychosocial gate | CoR gate | critical risk override | benchmarking
// Covers all 16 mandatory domains for Tier 2 (Desktop) and Tier 3 (Enterprise)
// All domains align to: WHS Act 2011 | WHS Reg 2025 (NSW) | Model CoPs | ISO 45001:2018
//
// SCORING MODEL:
//   Per question: 0 = not in place | 1 = partial | 2 = fully in place
//   Category Score = (Σ points ÷ (questions × 2)) × 100
//   Overall Score  = Weighted average of applicable category scores
//   Critical Risk Override: any critical risk → cap maturity at "Basic"
//
// Evidence types per question:
//   'photo'    — site photo evidence (Tier 3 field assessment)
//   'document' — policy, procedure, register, record upload
//   'both'     — either photo or document acceptable
//   'none'     — no evidence attachment required
// ════════════════════════════════════════════════════════════════════════════

export type EvidenceType = 'photo' | 'document' | 'both' | 'none';
export type RiskLevel    = 'Critical' | 'High' | 'Moderate' | 'Low';
export type TierApplicability = 2 | 3 | 'both';
export type QuestionScore = 0 | 1 | 2;  // 0=not in place, 1=partial, 2=fully in place

// ── Maturity bands (percentage → label) ──────────────────────────────────────
export type MaturityBand =
  | '🔴 Critical'    // 0–39%
  | '🟠 Basic'       // 40–59%
  | '🟡 Developing'  // 60–74%
  | '🟢 Competent'   // 75–89%
  | '🔵 Leading';    // 90–100%

// ── Weighted category model ───────────────────────────────────────────────────
export const CATEGORY_WEIGHTS: Record<string, number> = {
  'Compliance':                   10,
  'Risk Management':              20,
  'Systems & Procedures':         15,
  'Training & Competency':        10,
  'Consultation & Communication': 10,
  'Incident Management':          10,
  'Contractor Management':        10,
  // Conditional — added dynamically if applicable:
  // 'Psychosocial Risk':          10
  // 'Chain of Responsibility':     5
};

// Domain → weighted category mapping
export const DOMAIN_CATEGORY_MAP: Record<string, string> = {
  governance:      'Compliance',
  consultation:    'Consultation & Communication',
  risk:            'Risk Management',
  training:        'Training & Competency',
  incidents:       'Incident Management',
  emergency:       'Systems & Procedures',
  plant:           'Systems & Procedures',
  chemicals:       'Risk Management',
  document_ctrl:   'Systems & Procedures',
  psychosocial:    'Psychosocial Risk',
  office_ra:       'Systems & Procedures',
  contractor:      'Contractor Management',
  swms:            'Systems & Procedures',
  officer_dd:      'Compliance',
  hsr:             'Consultation & Communication',
  notifiable:      'Compliance',
  fatigue:         'Risk Management',
  cor:             'Chain of Responsibility',
};

export interface AssessmentQuestion {
  id:            string;              // e.g. "GOV-001"
  text:          string;              // question text
  context:       string;              // why this matters / legislative basis
  evidenceType:  EvidenceType;        // what evidence can be attached
  evidenceLabel: string;              // label shown on upload button
  tier:          TierApplicability;   // which tier this applies to
  trigger?: {                         // if score falls below threshold, fire a trigger
    threshold:   QuestionScore;       // 0 or 1 — fire if score <= threshold
    risk:        RiskLevel;
    flag:        string;
    legislation: string;
  };
}

export interface AssessmentDomain {
  id:           string;
  title:        string;
  isoClause:    string;
  legislation:  string;
  modelCoP?:    string;
  description:  string;
  tier:         TierApplicability;
  desktopNote?: string;              // Tier 2 limitation note shown in report
  questions:    AssessmentQuestion[];
}

// ── CoR Applicability Gate ────────────────────────────────────────────────────
// Must be assessed BEFORE any domain questions
export interface CoRApplicabilityCheck {
  usesHeavyVehicles:       boolean | null;  // GVM > 4.5t
  engagesTransportContractors: boolean | null;
  staffControlSchedules:   boolean | null;
  schedulePressureOnDrivers: boolean | null;
}
export function isCoRApplicable(check: CoRApplicabilityCheck): boolean {
  return !!(check.usesHeavyVehicles || check.engagesTransportContractors ||
            check.staffControlSchedules || check.schedulePressureOnDrivers);
}

// ── Psychosocial Applicability Gate ──────────────────────────────────────────
// Must be assessed BEFORE domain questions; any YES = applicable
export interface PsychosocialApplicabilityCheck {
  highWorkloadOrPressure:     boolean | null;
  conflictAgressionExposure:  boolean | null;
  stressBurnoutAbsenteeism:   boolean | null;
  remoteIsolatedHighDemand:   boolean | null;
}
export function isPsychosocialApplicable(check: PsychosocialApplicabilityCheck): boolean {
  return !!(check.highWorkloadOrPressure || check.conflictAgressionExposure ||
            check.stressBurnoutAbsenteeism || check.remoteIsolatedHighDemand);
}

// ── DOMAIN DEFINITIONS ────────────────────────────────────────────────────────
export const ASSESSMENT_DOMAINS: AssessmentDomain[] = [

  // ── D01: Leadership & WHS Governance ────────────────────────────────────
  {
    id: 'governance', title: 'Leadership & WHS Governance',
    isoClause: 'Cl. 5', legislation: 'WHS Act 2011 s.19, s.27',
    modelCoP: 'Work Health and Safety Management Systems',
    description: 'Leadership commitment, WHS policy, officer due diligence, governance structures.',
    tier: 'both',
    questions: [
      { id:'GOV-001', text:'Is there a signed, dated WHS Policy that has been reviewed within the last 12 months and communicated to all workers?', context:'WHS Act s.19 requires PCBU to have a WHS policy as part of its duty of care. ISO 45001 Cl.5.2.', evidenceType:'document', evidenceLabel:'Upload WHS Policy (PDF or Word)', tier:'both' },
      { id:'GOV-002', text:'Are WHS roles, responsibilities and accountabilities clearly assigned and documented for all levels of the organisation?', context:'ISO 45001 Cl.5.3 — roles, responsibilities and authorities must be assigned and communicated.', evidenceType:'document', evidenceLabel:'Upload responsibility matrix or position descriptions', tier:'both' },
      { id:'GOV-003', text:'Does senior leadership review WHS performance data (incident trends, audit results, KPIs) at regular intervals?', context:'ISO 45001 Cl.9.3 — management review. WHS Act s.19 — PCBU duty to monitor.', evidenceType:'document', evidenceLabel:'Upload management review minutes or WHS dashboard', tier:'both' },
      { id:'GOV-004', text:'Are WHS objectives documented, measurable and communicated to workers — with progress tracked?', context:'ISO 45001 Cl.6.2 — WHS objectives and planning to achieve them.', evidenceType:'document', evidenceLabel:'Upload WHS objectives register or plan', tier:'both' },
      { id:'GOV-005', text:'Is WHS integrated into business planning, procurement decisions and operational change management?', context:'ISO 45001 Cl.5.1 — leadership and commitment to integrate WHS into business processes.', evidenceType:'document', evidenceLabel:'Upload business plan extract or change management records', tier:3,
        trigger:{ threshold:1, risk:'High', flag:'WHS not integrated into business planning', legislation:'ISO 45001 Cl.5.1' } },
    ]
  },

  // ── D02: Consultation & Communication ────────────────────────────────────
  {
    id: 'consultation', title: 'Consultation & Communication',
    isoClause: 'Cl. 5.4', legislation: 'WHS Act 2011 s.46–49',
    modelCoP: 'Work Health and Safety Consultation, Cooperation and Coordination (Feb 2022)',
    description: 'Worker consultation arrangements, consultation records, DWG and HSR. Workers must be consulted BEFORE decisions are made — not just informed afterwards.',
    tier: 'both',
    questions: [
      { id:'CON-001', text:'Are formal WHS consultation arrangements documented and implemented — including method, frequency and records of outcomes? Workers must be consulted BEFORE decisions, not just informed after.', context:'WHS Act s.46 — PCBU must consult with workers on WHS matters. Consultation must be genuine and recorded. WHS Consultation CoP (Feb 2022) — toolbox talks alone are insufficient as the sole consultation mechanism.', evidenceType:'document', evidenceLabel:'Upload consultation records, toolbox talk sign-on sheets or meeting minutes', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'WHS consultation not established — WHS Act s.46 non-compliance', legislation:'WHS Act 2011 s.46' } },
      { id:'CON-002', text:'Are workers aware of how to raise a WHS concern and is there a documented process for escalation and resolution?', context:'WHS Act s.47 — workers must be given the opportunity to raise concerns and have them addressed.', evidenceType:'document', evidenceLabel:'Upload hazard reporting form or concern register', tier:'both' },
      { id:'CON-003', text:'Are WHS outcomes from consultation communicated back to workers in a timely and accessible way?', context:'ISO 45001 Cl.7.4 — communication of WHS information to workers.', evidenceType:'document', evidenceLabel:'Upload communication records or safety notice board photos', tier:'both' },
      { id:'CON-004', text:'Are there documented multi-employer coordination arrangements where the organisation shares a workplace with other PCBUs?', context:'WHS Act s.46 — PCBUs that share a workplace must consult, cooperate and coordinate with each other.', evidenceType:'document', evidenceLabel:'Upload site coordination agreement or principal contractor arrangement', tier:'both' },
      { id:'CON-005', text:'Are workers involved in developing and reviewing risk assessments, safe work procedures and incident investigation outcomes?', context:'ISO 45001 Cl.5.4 — worker participation in decision-making on WHS matters.', evidenceType:'both', evidenceLabel:'Upload sign-off records showing worker consultation on procedures', tier:3 },
    ]
  },

  // ── D03: Risk Management ─────────────────────────────────────────────────
  {
    id: 'risk', title: 'Hazard Identification & Risk Management',
    isoClause: 'Cl. 6.1', legislation: 'WHS Reg 2025 (NSW) r.34–38',
    modelCoP: 'How to Manage Work Health and Safety Risks',
    description: 'Hazard identification, risk assessment, hierarchy of controls, risk register. 4-step process: Identify → Assess → Control → Review.',
    tier: 'both',
    questions: [
      { id:'RISK-001', text:'Is there a documented hazard/risk register covering all work activities, updated when conditions or tasks change?', context:'WHS Reg 2025 r.36 — PCBU must identify hazards. r.38 — controls must be implemented. ISO 45001 Cl.6.1.2.', evidenceType:'document', evidenceLabel:'Upload hazard register or risk register', tier:'both',
        trigger:{ threshold:0, risk:'Critical', flag:'No documented hazard/risk register', legislation:'WHS Reg 2025 r.36' } },
      { id:'RISK-002', text:'Are risk assessments conducted systematically before new tasks, on new equipment, after incidents and when conditions change?', context:'WHS Reg 2025 r.36-38 — ongoing hazard identification and risk management obligation.', evidenceType:'document', evidenceLabel:'Upload risk assessment records or JSA/JHA documents', tier:'both' },
      { id:'RISK-003', text:'Are risk control measures applied using the hierarchy of controls — prioritising elimination over substitution, engineering, administrative and PPE?', context:'WHS Act s.17-18 — hierarchy of controls. Controls must be SFAIRP. ISO 45001 Cl.8.1.2. From 1 July 2026 (NSW): Codes of Practice are mandatory compliance benchmarks — compliance with the relevant CoP satisfies the corresponding duty, and non-compliance requires demonstrating an equivalent or higher standard.', evidenceType:'document', evidenceLabel:'Upload risk assessment showing hierarchy of controls applied', tier:'both' },
      { id:'RISK-004', text:'Are risk controls reviewed after any incident, near-miss or significant workplace change, with reviews documented?', context:'WHS Reg 2025 r.40 — duty to review and revise controls. ISO 45001 Cl.10.2.', evidenceType:'document', evidenceLabel:'Upload post-incident review records or control review log', tier:'both' },
      { id:'RISK-005', text:'Are residual risks communicated to all workers affected — including contractors — before work commences?', context:'ISO 45001 Cl.7.3 — workers must be aware of hazards and risks relevant to their work.', evidenceType:'both', evidenceLabel:'Upload briefing records, induction sign-on or pre-start meeting notes', tier:3 },
      // NEW v2.0: noise and electrical added per CoP audit findings
      { id:'RISK-006', text:'Are workplace noise levels assessed against the 85 dB(A) LAeq,8h exposure standard? Is an audiometric testing program in place — baseline within 3 months of employment, then every 2 years?', context:'WHS Reg 2025 r.57 (noise exposure standard) | r.62 (audiometric testing requirement) | Managing Noise CoP.', evidenceType:'document', evidenceLabel:'Upload noise assessment records and audiometric testing register', tier:'both' },
      { id:'RISK-007', text:'Are test and tag records current for all portable electrical equipment? Are RCDs in place for portable electrical equipment and tools?', context:'WHS Reg 2025 r.145–151 | Managing Electrical Risks CoP | Electrical Safety Act 2002 (NSW). Licensed electricians only for electrical work.', evidenceType:'document', evidenceLabel:'Upload test and tag register and RCD records', tier:'both' },
      { id:'RISK-008', text:'Are hazardous manual tasks systematically assessed (REBA or RULA tool) for all repetitive, sustained or awkward force tasks?', context:'WHS Reg 2025 r.60 | Hazardous Manual Tasks CoP — HOC must be applied: mechanise/automate before ergonomic tools before admin controls.', evidenceType:'document', evidenceLabel:'Upload hazardous manual task risk assessments', tier:'both' },
    ]
  },

  // ── D04: Training & Competency ───────────────────────────────────────────
  {
    id: 'training', title: 'Training, Competency & Induction',
    isoClause: 'Cl. 7.2', legislation: 'WHS Reg 2025 (NSW) r.39',
    modelCoP: 'Construction Work (induction requirements)',
    description: 'Worker induction, training records, competency verification, licence currency. r.39 mandatory from 1 January 2025: all mandatory training must be delivered by SafeWork NSW authorised providers only.',
    tier: 'both',
    questions: [
      { id:'TRN-001', text:'Is there a documented WHS induction process for all new workers, contractors and visitors — with completion recorded?', context:'WHS Reg 2025 r.39 — workers must be trained to perform work safely. Induction is fundamental.', evidenceType:'document', evidenceLabel:'Upload induction checklist, sign-on register or induction records', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'Worker induction process not established or not recorded', legislation:'WHS Reg 2025 r.39' } },
      { id:'TRN-002', text:'Are competency requirements documented for all roles, with a training needs analysis conducted and training scheduled accordingly?', context:'ISO 45001 Cl.7.2 — competence must be determined, training provided and effectiveness evaluated.', evidenceType:'document', evidenceLabel:'Upload training needs analysis or competency framework', tier:'both' },
      { id:'TRN-003', text:'Are training records maintained for all workers — including licence expiry dates — with alerts when renewal is due?', context:'WHS Reg 2025 r.39 — competency must be maintained. Expired licences create regulatory exposure.', evidenceType:'document', evidenceLabel:'Upload training matrix or licence register', tier:'both' },
      { id:'TRN-004', text:'Is training effectiveness evaluated — through assessment, observation or feedback — and records of evaluation maintained?', context:'ISO 45001 Cl.7.2 — training effectiveness must be evaluated.', evidenceType:'document', evidenceLabel:'Upload training assessment records or post-training evaluation forms', tier:'both' },
      { id:'TRN-005', text:'Have all workers who operate plant requiring High Risk Work (HRW) licences been verified — with current licence records on file?', context:'WHS Reg 2025 r.130-142 — HRW licence required for: scaffolding, crane, forklift, EWP, rigging, pressure equipment.', evidenceType:'document', evidenceLabel:'Upload HRW licence register or copies of current licences', tier:'both',
        trigger:{ threshold:1, risk:'Critical', flag:'HRW licence verification not completed', legislation:'WHS Reg 2025 r.130-142' } },
      // NEW v2.0: authorised providers mandatory from 1 Jan 2025
      { id:'TRN-006', text:'Is all mandatory WHS training (first aid, HRW licences, psychosocial, silica) delivered by SafeWork NSW authorised training providers only? (Mandatory from 1 January 2025 — r.39)', context:'WHS Reg 2025 r.39 — mandatory from 1 January 2025. Training from non-authorised providers does not satisfy the regulatory requirement. Verify authorisation numbers against safework.nsw.gov.au.', evidenceType:'document', evidenceLabel:'Upload training register showing SafeWork NSW authorisation numbers for each provider', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'Mandatory training delivered by non-authorised providers — WHS Reg 2025 r.39 breach', legislation:'WHS Reg 2025 r.39 (mandatory 1 January 2025)' } },
    ]
  },

  // ── D05: Incident Management ─────────────────────────────────────────────
  {
    id: 'incidents', title: 'Incident Reporting & Investigation',
    isoClause: 'Cl. 10.2', legislation: 'WHS Act 2011 s.35-38',
    modelCoP: 'How to Manage Work Health and Safety Risks',
    description: 'Incident register, near-miss reporting, root cause analysis, notifiable incidents.',
    tier: 'both',
    questions: [
      { id:'INC-001', text:'Is there a documented incident reporting procedure — covering incidents, near-misses and hazards — known to all workers?', context:'WHS Act s.38 — duty to notify. Incident reporting is the foundation of an effective WHS system.', evidenceType:'document', evidenceLabel:'Upload incident reporting procedure', tier:'both' },
      { id:'INC-002', text:'Are all incidents investigated using a structured root cause analysis methodology — with findings and corrective actions documented?', context:'ISO 45001 Cl.10.2 — nonconformity must be investigated and corrective actions verified for effectiveness.', evidenceType:'document', evidenceLabel:'Upload incident investigation reports (recent examples)', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'Root cause analysis not consistently conducted', legislation:'ISO 45001 Cl.10.2' } },
      { id:'INC-003', text:'Are corrective actions from incidents tracked through a register with owners, due dates and verification of close-out effectiveness?', context:'ISO 45001 Cl.10.2 — corrective action effectiveness must be reviewed.', evidenceType:'document', evidenceLabel:'Upload corrective action register showing close-out status', tier:'both' },
      { id:'INC-004', text:'Is there a documented procedure for identifying notifiable incidents — with clear SafeWork NSW notification steps (phone 13 10 50)?', context:'WHS Act s.36-38 — immediate notification of fatality, serious injury/illness or dangerous incident. Failure to notify: Category 2 offence.', evidenceType:'document', evidenceLabel:'Upload notifiable incident procedure or flowchart', tier:'both',
        trigger:{ threshold:1, risk:'Critical', flag:'Notifiable incident notification procedure not documented', legislation:'WHS Act 2011 s.38' } },
      { id:'INC-005', text:'Are incident trends analysed and reported to management/leadership quarterly, with patterns used to drive systemic improvements?', context:'ISO 45001 Cl.9.1 — performance evaluation. Trend analysis is a key leading/lagging indicator function.', evidenceType:'document', evidenceLabel:'Upload incident trend report or safety dashboard', tier:3 },
    ]
  },

  // ── D06: Emergency Management ─────────────────────────────────────────────
  {
    id: 'emergency', title: 'Emergency Management & Preparedness',
    isoClause: 'Cl. 8.2', legislation: 'WHS Reg 2025 (NSW) r.43; AS 3745',
    modelCoP: 'Emergency Plans; First Aid in the Workplace',
    description: 'Emergency response plan, drills, wardens, first aid, evacuation procedures.',
    tier: 'both',
    questions: [
      { id:'EMG-001', text:'Is there a documented Emergency Response Plan (ERP) — covering evacuation, first aid, fire, and site-specific scenarios — reviewed in the last 12 months?', context:'WHS Reg 2025 r.43 — emergency plan required. Model CoP: Emergency Plans — plan must be site-specific and tested.', evidenceType:'document', evidenceLabel:'Upload Emergency Response Plan or Emergency Management Procedure', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'Emergency Response Plan absent or not reviewed', legislation:'WHS Reg 2025 r.43' } },
      { id:'EMG-002', text:'Have emergency evacuation drills been conducted at least annually — with outcomes debriefed, documented and fed back into the ERP?', context:'AS 3745 and Model CoP: Emergency Plans — drills must be conducted and documented.', evidenceType:'both', evidenceLabel:'Upload drill records, debrief notes or evacuation report', tier:'both' },
      { id:'EMG-003', text:'Are emergency wardens appointed and trained — with current training records on file and roles communicated to all workers?', context:'AS 3745 — trained emergency wardens required. WHS Reg 2025 r.43.', evidenceType:'document', evidenceLabel:'Upload warden appointment records and training certificates', tier:'both' },
      { id:'EMG-004', text:'Are first aid kits stocked to required levels (appropriate to workplace hazards), with trained first aiders at adequate ratios (minimum 1:10 high risk, 1:25 low risk) and current HLTAID011 certificates on file?', context:'WHS Reg 2025 r.42 — first aid obligations. First Aid CoP — ratio and hazard-based kit requirements. Certificate valid 3 years; CPR (HLTAID009) refreshed annually.', evidenceType:'both', evidenceLabel:'Upload first aid kit inspection record and first aider training certificates', tier:'both' },
    ]
  },

  // ── D07: Plant & Equipment ────────────────────────────────────────────────
  {
    id: 'plant', title: 'Plant & Equipment Safety',
    isoClause: 'Cl. 8.1', legislation: 'WHS Reg 2025 (NSW) r.200–241',
    modelCoP: 'Managing the Risks of Plant in the Workplace (2022)',
    description: 'Plant registration, pre-start inspections, maintenance records, LOTO, operator competency.',
    tier: 'both',
    questions: [
      { id:'PLT-001', text:'Is all registered plant current with SafeWork NSW — with registration numbers on file and operating manuals available for all registered plant?', context:'WHS Reg 2025 r.200+ — plant design and item registration. Managing Risks of Plant CoP (2022) — design registration required for major plant categories.', evidenceType:'document', evidenceLabel:'Upload plant register with registration numbers', tier:'both' },
      { id:'PLT-002', text:'Are pre-start inspection records completed before each use or shift for all relevant plant — with non-conformances reported and actioned?', context:'WHS Reg 2025 r.203 — plant must be safe. Managing Risks of Plant CoP (2022) — pre-start checks and records.', evidenceType:'document', evidenceLabel:'Upload completed pre-start inspection forms (recent examples)', tier:'both' },
      { id:'PLT-003', text:'Are maintenance records retained for the FULL working life of all plant items — not just the current maintenance period? Are operating manuals current and accessible?', context:'Managing Risks of Plant CoP (2022) — maintenance records must be retained for the full plant life. ISO 45001 Cl.8.1.', evidenceType:'document', evidenceLabel:'Upload maintenance record examples showing life-of-plant tracking', tier:'both' },
      { id:'PLT-004', text:'Are lockout/tagout (LOTO) procedures in place for all plant maintenance and repair — ensuring energy isolation before any maintenance commences?', context:'WHS Reg 2025 r.208 — isolation of plant during maintenance. Managing Risks of Plant CoP (2022).', evidenceType:'document', evidenceLabel:'Upload LOTO procedure and completed isolation tags or permits', tier:'both' },
      { id:'PLT-005', text:'Are all plant operators competency-verified and licensed where HRW licences are required — with operator records on file?', context:'WHS Reg 2025 r.130-142 — HRW licences for crane, forklift, EWP, scaffolding, rigging, pressure equipment operators.', evidenceType:'document', evidenceLabel:'Upload operator competency records and HRW licence copies', tier:3 },
    ]
  },

  // ── D08: Hazardous Chemicals ──────────────────────────────────────────────
  {
    id: 'chemicals', title: 'Hazardous Chemicals & Substances',
    isoClause: 'Cl. 8.1', legislation: 'WHS Reg 2025 (NSW) r.332–357',
    modelCoP: 'Managing Risks of Hazardous Chemicals; Labelling of Workplace Hazardous Chemicals',
    description: 'Chemical register, SDS, risk assessment per chemical group, GHS labelling, health monitoring, Cl.430 silica obligations.',
    tier: 'both',
    questions: [
      { id:'CHM-001', text:'Is a chemical register maintained — listing all hazardous chemicals on site — with current Safety Data Sheets (SDS, within 5 years) accessible at point of use?', context:'WHS Reg 2025 r.332 — chemical register and SDS requirements. Managing Risks of Hazardous Chemicals CoP.', evidenceType:'document', evidenceLabel:'Upload chemical register and sample SDS pages', tier:'both' },
      { id:'CHM-002', text:'Has a risk assessment been conducted for each hazardous chemical GROUP — not just existence of a register? Are controls applied using the HOC?', context:'Managing Risks of Hazardous Chemicals CoP — a register alone is insufficient. Each chemical group requires a risk assessment.', evidenceType:'document', evidenceLabel:'Upload chemical risk assessments by chemical group', tier:'both' },
      { id:'CHM-003', text:'Are all hazardous chemicals labelled in accordance with GHS/WHS Regulation labelling requirements? Are decanted or transferred chemicals labelled correctly?', context:'WHS Reg 2025 r.332 | Labelling of Workplace Hazardous Chemicals CoP — GHS labels required. Unlabelled decanted containers are a common compliance gap.', evidenceType:'both', evidenceLabel:'Upload photos of chemical storage labelling and decanted container labels', tier:'both' },
      // NEW v2.0: Cl.430 silica mandatory Oct 2025
      { id:'CHM-004', text:'For silica-risk work (concrete cutting, masonry, tunnelling, engineered stone): Is the Silica Worker Register completed with SafeWork NSW? Are workers registered within 28 days of commencement? Is air monitoring conducted against WES-TWA 0.05 mg/m³ RCS?', context:'WHS Reg 2025 Cl.430 — mandatory from 1 October 2025. Silica Worker Register registration required within 28 days of exposure commencement. Baseline and annual medical surveillance by occupational physician. Note: Workplace Exposure Limits (WEL) replace Workplace Exposure Standards (WES) from 1 December 2026 — the numerical limit of 0.05 mg/m³ RCS remains, but terminology must be updated in monitoring records, risk assessments, and SWMS from December 2026.', evidenceType:'document', evidenceLabel:'Upload SafeWork NSW Silica Worker Register entries, air monitoring results, medical surveillance records', tier:'both',
        trigger:{ threshold:1, risk:'Critical', flag:'Silica Worker Register not completed — WHS Reg 2025 Cl.430 mandatory from 1 October 2025', legislation:'WHS Reg 2025 Cl.430' } },
    ]
  },

  // ── D09: Document Control ─────────────────────────────────────────────────
  {
    id: 'document_ctrl', title: 'Document Control & WHS Systems',
    isoClause: 'Cl. 7.5', legislation: 'WHS Reg 2025 (NSW) r.44',
    description: 'Version control, document retention (minimum 5 years), accessibility to workers.',
    tier: 'both',
    questions: [
      { id:'DOC-001', text:'Are all WHS documents version controlled — with date, version number and document owner — and is a master document register maintained?', context:'ISO 45001 Cl.7.5 — documented information must be controlled.', evidenceType:'document', evidenceLabel:'Upload document register extract or sample controlled documents', tier:'both' },
      { id:'DOC-002', text:'Are WHS documents retained for at least 5 years as required under WHS Act s.36 — with a documented retention schedule?', context:'WHS Act s.36 — records must be retained. ISO 45001 Cl.7.5.3 — documented information must be protected.', evidenceType:'document', evidenceLabel:'Upload document retention schedule or records management policy', tier:'both' },
      { id:'DOC-003', text:'Are WHS documents accessible to all workers who need them — including contractors — and are obsolete versions removed from circulation?', context:'ISO 45001 Cl.7.5 — documents must be available at point of use.', evidenceType:'document', evidenceLabel:'Upload evidence of document accessibility (intranet, shared drive, physical location)', tier:'both' },
    ]
  },

  // ── D10: Psychosocial Risk Management ────────────────────────────────────
  // Mandatory assessment — WHS Reg 2025 r.36 from 1 January 2025
  // EAP is Level 6 (last resort) ONLY — never primary control
  {
    id: 'psychosocial', title: 'Psychosocial Risk Management',
    isoClause: 'Cl. 6.1.2', legislation: 'WHS Reg 2025 (NSW) r.36 (mandatory from 1 January 2025)',
    modelCoP: 'Managing Psychosocial Hazards at Work CoP (2021) | Sexual & Gender-Based Harassment CoP (June 2024) | Managing Fatigue at Work CoP (February 2026)',
    description: 'Assessment of all 15 Model CoP psychosocial hazard categories using HOC Levels 1–4 before EAP (Level 6). EAP is NEVER a primary control. Includes sexual harassment (June 2024 CoP — standalone obligation) and fatigue (Feb 2026 CoP — all workers).',
    tier: 'both',
    desktopNote: 'Psychosocial risk effectiveness cannot be fully verified from documentation alone. Anonymous worker survey recommended. On-site worker engagement required for Tier 3.',
    questions: [
      { id:'PSY-001', text:'Have all 15 Model CoP psychosocial hazard categories been assessed — including sexual harassment (June 2024 CoP) and fatigue (Feb 2026 CoP)?', context:'WHS Reg 2025 r.36 (mandatory 1 Jan 2025) | Managing Psychosocial Hazards CoP (2021) | Sexual & Gender-Based Harassment CoP (Jun 2024) | Fatigue CoP (Feb 2026).', evidenceType:'document', evidenceLabel:'Upload psychosocial hazard register or risk assessment covering all 15 categories', tier:'both',
        trigger:{ threshold:1, risk:'Critical', flag:'Psychosocial hazard assessment not completed — WHS Reg 2025 r.36 mandatory from 1 January 2025', legislation:'WHS Reg 2025 r.36' } },
      { id:'PSY-002', text:'Are psychosocial controls applied using HOC Levels 1–4 (work design, role redesign, isolation, admin controls) BEFORE EAP? Is EAP positioned as Level 6 last resort only?', context:'WHS Reg 2025 r.36 — EAP-only approach is non-compliant. HOC Levels 1–4 must be applied and documented first. EAP alone does NOT satisfy r.36.', evidenceType:'document', evidenceLabel:'Upload HOC control plan (SSC-WHS-PSY-001) showing Levels 1–4 before EAP', tier:'both',
        trigger:{ threshold:1, risk:'Critical', flag:'EAP used as primary psychosocial control — WHS Reg 2025 r.36 non-compliant. HOC Levels 1–4 must be applied first.', legislation:'WHS Reg 2025 r.36' } },
      { id:'PSY-003', text:'Is there an anonymous mechanism for workers to report psychosocial hazards and concerns — separate from the standard incident reporting process?', context:'Managing Psychosocial Hazards CoP Cl.3.4 — confidential reporting supports worker trust and early identification.', evidenceType:'document', evidenceLabel:'Upload evidence of anonymous reporting mechanism (survey, hotline, digital form)', tier:'both' },
      { id:'PSY-004', text:'Has a sexual and gender-based harassment risk assessment been conducted per the June 2024 CoP — with a confidential reporting mechanism and documented investigation procedure?', context:'Sexual & Gender-Based Harassment CoP (June 2024) — standalone NSW CoP. Sexual harassment is a psychosocial hazard. HOC applies. Investigation must be prompt, fair, and impartial.', evidenceType:'document', evidenceLabel:'Upload sexual harassment risk assessment and reporting procedure', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'Sexual and gender-based harassment risk assessment not conducted — Sexual Harassment CoP (June 2024) standalone obligation', legislation:'WHS Act s.19 | Sexual & Gender-Based Harassment CoP June 2024' } },
      { id:'PSY-005', text:'Has a standalone fatigue risk assessment been completed for ALL workers — not just heavy vehicle drivers? Are rosters reviewed against fatigue risk factors (shift length, consecutive days, travel time)?', context:'Managing Fatigue at Work CoP (February 2026) — standalone obligation for ALL workers. Fatigue is both a psychosocial hazard (WHS Reg 2025 r.36) and a separate safety obligation under the February 2026 CoP.', evidenceType:'document', evidenceLabel:'Upload standalone fatigue risk assessment and roster design review records', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'Standalone fatigue risk assessment for all workers not completed — Fatigue at Work CoP (February 2026) obligation', legislation:'Managing Fatigue at Work CoP (February 2026) | WHS Act s.19' } },
      { id:'PSY-006', text:'Are return-to-work (RTW) processes specifically designed for psychological injury cases — with graduated return plans and RTW coordinator trained in psychological injury management?', context:'Managing Psychosocial Hazards CoP — RTW systems for psychological injury are a critical gap identified in Safe Work Australia research (2026). Psychological injuries cause longer absences and higher costs than physical injuries.', evidenceType:'document', evidenceLabel:'Upload psychological injury RTW procedure and RTW coordinator training records', tier:3 },
      // NEW v2.1: Digital Work Systems Act 2026 (NSW)
      { id:'PSY-007', text:'Are digital work systems (AI, algorithmic scheduling, automated performance monitoring, app-based task allocation) assessed for WHS risks — ensuring they do not impose excessive workloads, unsustainable pace demands, or psychological pressure on workers?', context:'Work Health and Safety Amendment (Digital Work Systems) Act 2026 (NSW) — explicit duty to ensure AI and algorithmic work allocation systems do not put workers at risk. This is a new mandatory obligation effective 1 July 2026. PCBUs must identify and control WHS risks created by digital systems including: algorithmic scheduling that creates fatigue risk, AI performance monitoring that creates psychological pressure, app-based task allocation that prevents workers from controlling their work pace.', evidenceType:'document', evidenceLabel:'Upload digital systems risk assessment, algorithm governance policy, or AI/platform WHS review', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'Digital work systems risk assessment not conducted — Work Health and Safety Amendment (Digital Work Systems) Act 2026 (NSW) obligation from 1 July 2026', legislation:'WHS Amendment (Digital Work Systems) Act 2026 (NSW)' } },
    ]
  },

  // ── D11: Office / Physical Workplace ─────────────────────────────────────
  {
    id: 'office_ra', title: 'Physical Workplace & Facilities',
    isoClause: 'Cl. 8.1', legislation: 'WHS Reg 2025 (NSW) Part 3.1 (r.228)',
    modelCoP: 'Managing the Work Environment and Facilities CoP',
    description: 'Work environment assessment: facilities (toilets, meal areas), lighting, ventilation, temperature controls, housekeeping. Required for all assessments — not just Tier 3.',
    tier: 'both',
    desktopNote: 'Physical workplace conditions cannot be fully verified by desktop review. Field verification recommended. Organisation to provide photographic evidence or self-assessment.',
    questions: [
      { id:'ORA-001', text:'Are workplace facilities adequate and compliant with WHS Reg 2025 Part 3.1? (Toilets, washing facilities, meal areas, change rooms appropriate for worker numbers)', context:'WHS Reg 2025 Part 3.1 (r.228) | Managing the Work Environment and Facilities CoP — minimum facilities are a legal obligation, not a discretionary amenity.', evidenceType:'both', evidenceLabel:'Upload facility inspection record or photo evidence of facilities', tier:'both' },
      { id:'ORA-002', text:'Is lighting adequate for all tasks performed? Are temperature controls adequate (not below 7°C or above 35°C without engineering controls)? Is ventilation adequate for all enclosed work areas?', context:'Managing the Work Environment and Facilities CoP | AS/NZS 1680 (lighting standard — 320 lux minimum for office work). WHS Reg 2025 Part 3.1.', evidenceType:'both', evidenceLabel:'Upload lighting measurement record or photo of work environment', tier:'both' },
      { id:'ORA-003', text:'Are floors, walkways, and work areas maintained free of hazards, spills, and obstructions? Are cable management and housekeeping standards maintained?', context:'Managing the Work Environment and Facilities CoP | WHS Act s.19 — safe work environment obligation. Slip, trip and fall from housekeeping failures is a leading cause of workplace injury.', evidenceType:'both', evidenceLabel:'Upload housekeeping inspection records or site photos', tier:'both' },
      { id:'ORA-004', text:'Are workstations assessed per AS/NZS 3590 (monitor height, chair adjustment, keyboard, wrist posture) — with screen break arrangements in place?', context:'Managing the Work Environment and Facilities CoP | Hazardous Manual Tasks CoP | AS/NZS 3590 workstation standard.', evidenceType:'photo', evidenceLabel:'Upload workstation assessment record or photo', tier:3 },
      { id:'ORA-005', text:'Are all portable electrical appliances tested and tagged per AS/NZS 3760? Are RCDs installed and tested? Are switchboards accessible?', context:'WHS Reg 2025 r.145–151 | Managing Electrical Risks CoP | AS/NZS 3760. RCDs required for portable equipment in construction, outdoor, and wet environments.', evidenceType:'both', evidenceLabel:'Upload test and tag register and RCD inspection records', tier:3 },
    ]
  },

  // ── D12: Contractor & Supply Chain Safety ─────────────────────────────────
  {
    id: 'contractor', title: 'Contractor & Supply Chain Safety',
    isoClause: 'Cl. 8.1', legislation: 'WHS Act 2011 s.20; WHS Reg 2025 r.291+',
    // NOTE: ISO 45001:2018 Cl.8.1 — NOT Cl.8.4 (Cl.8.4 does not exist in ISO 45001)
    modelCoP: 'Construction Work CoP (r.291-317); Managing Risks of Plant (2022)',
    description: 'Contractor pre-qualification, site induction, SWMS review, multi-employer coordination, performance monitoring. ISO 45001 Cl.8.1 (NOT Cl.8.4 — that clause does not exist).',
    tier: 'both',
    questions: [
      { id:'CTR-001', text:'Is there a formal contractor pre-qualification process — assessing WHS capability, licences, insurance, and past performance — before engagement?', context:'WHS Act s.20 — upstream PCBU duty. ISO 45001:2018 Cl.8.1 — external provision. SSC-STD-CTR-002 pre-qualification standard.', evidenceType:'document', evidenceLabel:'Upload contractor pre-qualification records or WHS capability assessment forms', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'Contractor pre-qualification process not in place — WHS Act s.20 upstream PCBU duty exposure', legislation:'WHS Act 2011 s.20 | ISO 45001 Cl.8.1' } },
      { id:'CTR-002', text:'Do all contractors receive a site-specific WHS induction before commencing work — with induction records maintained?', context:'WHS Reg 2025 r.291+ — site induction required. Construction Work CoP.', evidenceType:'document', evidenceLabel:'Upload contractor induction records and site induction checklist', tier:'both' },
      { id:'CTR-003', text:'Are contractor SWMS reviewed and approved by the PCBU BEFORE high-risk construction work commences — is the adequacy of the SWMS assessed (not just acknowledged receipt)?', context:'WHS Reg 2025 r.299 — SWMS must be prepared and followed. Construction Work CoP — PC must verify SWMS adequacy before HRCW commences.', evidenceType:'document', evidenceLabel:'Upload contractor SWMS with review sign-off records', tier:'both' },
      { id:'CTR-004', text:'Is contractor WHS performance monitored during works — through inspection records, toolbox attendance, or periodic reviews?', context:'ISO 45001:2018 Cl.8.1 — performance monitoring of external providers. WHS Act s.20 ongoing duty.', evidenceType:'document', evidenceLabel:'Upload contractor inspection records or performance monitoring log', tier:'both' },
      { id:'CTR-005', text:'For construction projects >$250k or multi-contractor sites: Is a Principal Contractor appointed? Is a WHS Management Plan in place before work commences?', context:'WHS Reg 2025 r.293 — PC appointment and WHS Management Plan required for projects >$250k. Construction Work CoP.', evidenceType:'document', evidenceLabel:'Upload Principal Contractor appointment and WHS Management Plan', tier:'both' },
    ]
  },

  // ── D13: Safe Work Procedures & SWMS ─────────────────────────────────────
  {
    id: 'swms', title: 'Safe Work Procedures & SWMS',
    isoClause: 'Cl. 8.1', legislation: 'WHS Reg 2025 r.299-302',
    modelCoP: 'Construction Work CoP (SWMS requirements)',
    description: 'HRCW identification, SWMS adequacy, worker consultation on procedures, version control.',
    tier: 'both',
    questions: [
      { id:'SWP-001', text:'Is there a current HRCW (High Risk Construction Work) identification list — covering all 18 HRCW categories — and are SWMS prepared for each identified HRCW activity?', context:'WHS Reg 2025 r.299 — SWMS required for all HRCW. 18 HRCW categories include: WAH >2m, demolition, excavation >1.5m, confined space, pressurised equipment.', evidenceType:'document', evidenceLabel:'Upload HRCW identification list and SWMS register', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'HRCW identification not completed or SWMS not prepared for all HRCW activities', legislation:'WHS Reg 2025 r.299' } },
      { id:'SWP-002', text:'Do SWMS include initial and residual risk ratings, HOC application, and specific controls — and are workers consulted in SWMS preparation per WHS Reg r.299(3)?', context:'WHS Reg 2025 r.299(3) — workers who carry out HRCW must be consulted in SWMS preparation. SWMS must include risk ratings before and after controls.', evidenceType:'document', evidenceLabel:'Upload SWMS examples showing risk ratings and worker sign-off', tier:'both' },
      { id:'SWP-003', text:'Are SWMS and safe work procedures version controlled and reviewed after any change to work method, equipment, or following an incident?', context:'ISO 45001 Cl.7.5 — documented information must be controlled. WHS Reg 2025 r.299 — SWMS must be reviewed and revised when conditions change.', evidenceType:'document', evidenceLabel:'Upload version-controlled SWMS examples with revision history', tier:'both' },
    ]
  },

  // ── D14: Officer Due Diligence ────────────────────────────────────────────
  {
    id: 'officer_dd', title: 'Officer Due Diligence (WHS Act s.27)',
    isoClause: 'Cl. 5.1', legislation: 'WHS Act 2011 s.27 — 6 statutory elements',
    description: 'All 6 statutory due diligence elements: knowledge, operations, resources, information, processes, verification.',
    tier: 'both',
    desktopNote: 'All findings are documentation-based. Actual officer engagement and WHS knowledge may exceed what is documented. Officers should seek independent legal advice on personal obligations.',
    questions: [
      { id:'ODD-001', text:'Do officers of the PCBU acquire and maintain up-to-date knowledge of WHS matters — through training, external briefings, industry publications or expert advice?', context:'WHS Act s.27(a) — officers must acquire and keep up to date knowledge of WHS matters. Personal obligation.', evidenceType:'document', evidenceLabel:'Upload officer WHS training records, CPD certificates or expert briefing notes', tier:'both',
        trigger:{ threshold:1, risk:'Critical', flag:'Officer WHS knowledge acquisition not evidenced — WHS Act s.27(a)', legislation:'WHS Act 2011 s.27(a)' } },
      { id:'ODD-002', text:'Do officers gain and maintain an understanding of the organisation\'s operations — including the nature, scale and associated WHS hazards and risks?', context:'WHS Act s.27(b) — officers must understand operations. Board-level visibility of operational hazards is essential.', evidenceType:'document', evidenceLabel:'Upload board/management WHS risk briefing, site visit records or hazard profile review evidence', tier:'both' },
      { id:'ODD-003', text:'Do officers ensure the PCBU has appropriate resources and processes available — including budget, personnel, specialist access and systems — to manage WHS?', context:'WHS Act s.27(c) — officers must ensure resources. WHS budget, dedicated WHS personnel, and specialist access are key indicators.', evidenceType:'document', evidenceLabel:'Upload WHS budget allocation, organisation chart showing WHS resources', tier:'both' },
      { id:'ODD-004', text:'Do officers ensure there are processes for receiving, reviewing and responding to WHS information — including incidents, audits, KPIs and regulatory updates?', context:'WHS Act s.27(d) — officers must receive and consider WHS information. Structured board WHS reporting is required.', evidenceType:'document', evidenceLabel:'Upload board WHS reports, management KPI dashboard or meeting minutes with WHS agenda', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'No structured WHS reporting to officers — WHS Act s.27(d)', legislation:'WHS Act 2011 s.27(d)' } },
      { id:'ODD-005', text:'Do officers verify that the resources and processes required under their due diligence obligations are actually functioning as intended — not just documented?', context:'WHS Act s.27(f) — officers must verify. Reliance on reports alone is not verification. Independent audits, site visits and direct worker engagement are key methods.', evidenceType:'document', evidenceLabel:'Upload independent audit reports, officer site visit records or compliance verification evidence', tier:'both',
        trigger:{ threshold:1, risk:'Critical', flag:'No officer compliance verification — WHS Act s.27(f). Personal liability exposure.', legislation:'WHS Act 2011 s.27(f)' } },
    ]
  },

  // ── D15: HSR & Worker Representation ─────────────────────────────────────
  {
    id: 'hsr', title: 'HSR & Worker Representation',
    isoClause: 'Cl. 5.4', legislation: 'WHS Act 2011 s.51–72',
    description: 'DWG establishment, HSR elections, HSR training, issue resolution procedures, HSR powers.',
    tier: 'both',
    desktopNote: 'Worker experience of HSR effectiveness cannot be confirmed from documentation alone. On-site worker consultation recommended.',
    questions: [
      { id:'HSR-001', text:'Are Designated Work Groups (DWGs) established — or has the organisation confirmed that workers have not requested DWG establishment?', context:'WHS Act s.51-63 — workers may request DWG establishment. PCBU must negotiate and facilitate.', evidenceType:'document', evidenceLabel:'Upload DWG establishment records or written evidence that workers have not requested DWG', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'DWG establishment status not confirmed — WHS Act s.51-63', legislation:'WHS Act 2011 s.51' } },
      { id:'HSR-002', text:'Have Health and Safety Representatives (HSRs) been elected for each DWG — with election records on file and HSR identity communicated to all workers?', context:'WHS Act s.64-72 — HSR election process. HSRs serve a 3-year term. Workers must know who their HSR is.', evidenceType:'document', evidenceLabel:'Upload HSR election records and HSR notice issued to workers', tier:'both' },
      { id:'HSR-003', text:'Have elected HSRs completed an approved HSR training course within 3 months of election — with training completion records maintained?', context:'WHS Act s.72 — PCBU must allow HSRs to attend approved training within 3 months. This is a non-negotiable obligation.', evidenceType:'document', evidenceLabel:'Upload HSR training completion certificates', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'HSR training not completed within 3 months of election — WHS Act s.72 breach', legislation:'WHS Act 2011 s.72' } },
      { id:'HSR-004', text:'Is there a documented issue resolution procedure covering: how issues are raised, steps for resolution, timeframes and escalation?', context:'WHS Act s.76 — HSR may require resolution of WHS issue. Procedure must exist.', evidenceType:'document', evidenceLabel:'Upload issue resolution procedure', tier:'both' },
    ]
  },

  // ── D16: Notifiable Incidents & Regulatory Reporting ─────────────────────
  {
    id: 'notifiable', title: 'Notifiable Incidents & Regulatory Reporting',
    isoClause: 'Cl. 10.2', legislation: 'WHS Act 2011 s.35–38; WHS Reg r.695–700',
    description: 'Notifiable incident identification, scene preservation, SafeWork NSW notification, post-incident investigation.',
    tier: 'both',
    questions: [
      // UPDATED v2.1: Expanded notifiable incident categories from Model WHS Act 2026 amendments
      { id:'NOT-001', text:'Do all managers and supervisors know ALL notifiable incident categories — including: (1) death, (2) serious injury or illness, (3) dangerous incident, (4) violent incidents (including sexual assault), (5) notifiable extended absences (worker unable to work for 15+ consecutive days due to a work-related condition), and (6) notifiable suicides (worker suicide with reasonable connection to work)? And do they know the notification process (SafeWork NSW 13 10 50)?', context:'Model WHS Act 2026 amendments — expanded notification requirements effective 1 July 2026. The 3 original categories remain, plus 3 new categories: violent incidents, notifiable extended absences (≥15 days), and notifiable suicides. Failure to notify ANY category is a Category 2 offence. This expansion is a significant change — most managers are trained on only 3 categories and will not be aware of the new obligations.', evidenceType:'document', evidenceLabel:'Upload manager training records confirming awareness of all 6 notifiable incident categories (updated July 2026)', tier:'both',
        trigger:{ threshold:1, risk:'Critical', flag:'Awareness of expanded notifiable incident categories (violence, extended absence ≥15 days, suicide) not confirmed — Model WHS Act 2026 amendment', legislation:'Model WHS Act 2026 s.35-37 (expanded categories from 1 July 2026)' } },
      { id:'NOT-002', text:'Is there a documented scene preservation procedure — ensuring the site of a notifiable incident is not disturbed until SafeWork NSW grants permission?', context:'WHS Act s.39 — duty to preserve scene. Failure to preserve: separate offence. Verbal instruction is insufficient.', evidenceType:'document', evidenceLabel:'Upload scene preservation procedure or incident response flowchart', tier:'both',
        trigger:{ threshold:1, risk:'Critical', flag:'Scene preservation procedure not documented — WHS Act s.39 breach risk', legislation:'WHS Act 2011 s.39' } },
      { id:'NOT-003', text:'Is SafeWork NSW notification (13 10 50) integrated into the incident management procedure — with written notification within 48 hours also documented?', context:'WHS Act s.38 — immediate telephone notification, then written within 48 hours. Both steps must be documented.', evidenceType:'document', evidenceLabel:'Upload incident management procedure showing notification steps', tier:'both' },
      { id:'NOT-004', text:'Are incident investigations reviewed to confirm no notifiable incidents have been incorrectly classified — with a periodic audit of the incident register?', context:'Under-classification risk — dangerous incidents in particular are often not recognised. Periodic audit reduces liability.', evidenceType:'document', evidenceLabel:'Upload incident register audit record or review checklist', tier:'both' },
    ]
  },

  // ── D17: Fatigue & Hours of Work ─────────────────────────────────────────
  // Standalone obligation under Fatigue at Work CoP (February 2026) — ALL workers
  {
    id: 'fatigue', title: 'Fatigue Management (All Workers)',
    isoClause: 'Cl. 6.1.2', legislation: 'WHS Act 2011 s.19; Managing Fatigue at Work CoP (February 2026)',
    modelCoP: 'Managing Fatigue at Work CoP (February 2026) — standalone obligation, ALL workers',
    description: 'Fatigue is now a standalone WHS obligation for ALL workers — not just heavy vehicle drivers. Assessment of roster design, shift length, consecutive days, and travel time. A fatigue management plan is required where fatigue risk is identified.',
    tier: 'both',
    questions: [
      { id:'FAT-001', text:'Has a standalone fatigue risk assessment been completed for ALL workers — covering roster design, shift length, consecutive work days, rest periods, and travel time? (Not just heavy vehicle drivers)', context:'Managing Fatigue at Work CoP (February 2026) — standalone obligation for ALL workers commenced February 2026. This CoP is separate from CoR fatigue management.', evidenceType:'document', evidenceLabel:'Upload standalone fatigue risk assessment (covering all worker types, not just drivers)', tier:'both',
        trigger:{ threshold:1, risk:'High', flag:'Standalone fatigue risk assessment for all workers not completed — Fatigue at Work CoP (February 2026)', legislation:'Managing Fatigue at Work CoP (February 2026) | WHS Act s.19' } },
      { id:'FAT-002', text:'Are rosters designed to minimise fatigue risk — avoiding excessive consecutive shifts, short turnarounds, night/early morning combinations, and excessive weekly hours?', context:'Managing Fatigue at Work CoP (February 2026) — HOC applies to fatigue. Roster design (work design) is HOC Level 1. Admin controls (policies) are insufficient on their own.', evidenceType:'document', evidenceLabel:'Upload roster design guidelines or fatigue-assessed roster examples', tier:'both' },
      { id:'FAT-003', text:'Is a documented fatigue management plan or procedure in place — covering maximum hours, minimum rest, shift design principles, and fatigue reporting?', context:'Managing Fatigue at Work CoP (February 2026) — fatigue management plan required where fatigue risk is identified.', evidenceType:'document', evidenceLabel:'Upload fatigue management policy or hours of work procedure', tier:'both' },
      { id:'FAT-004', text:'For heavy vehicle operations: are CoR fatigue management obligations met — driver fatigue plans, logbook compliance, and realistic delivery schedules without unsafe pressure?', context:'Heavy Vehicle National Law (HVNL) — CoR fatigue management. Chain of Responsibility obligations. Links to CoR gate assessment.', evidenceType:'document', evidenceLabel:'Upload driver fatigue policy, logbook records or CoR compliance documentation', tier:'both' },
    ]
  },

];

// ── UTILITY FUNCTIONS ────────────────────────────────────────────────────────

export function getDomainsForTier(tier: 2 | 3): AssessmentDomain[] {
  return ASSESSMENT_DOMAINS.filter(d => d.tier === 'both' || d.tier === tier);
}

export function getTotalQuestions(tier: 2 | 3): number {
  return getDomainsForTier(tier).reduce((sum, d) => {
    return sum + d.questions.filter(q => q.tier === 'both' || q.tier === tier).length;
  }, 0);
}

// ── NEW v2.0: 0/1/2 scoring — category percentage ────────────────────────────
// IMPORTANT: score of 0 is valid (not in place) — do NOT filter it out
export function getDomainScore(
  domainId: string,
  responses: Record<string, QuestionScore | number>,
  tier: 2 | 3
): number | null {
  const domain = ASSESSMENT_DOMAINS.find(d => d.id === domainId);
  if (!domain) return null;
  const applicable = domain.questions.filter(q => q.tier === 'both' || q.tier === tier);
  const answered   = applicable.filter(q => responses[q.id] !== undefined);
  if (!answered.length) return null;
  const totalPoints = answered.reduce((sum, q) => sum + (responses[q.id] || 0), 0);
  const maxPoints   = answered.length * 2;
  return Math.round((totalPoints / maxPoints) * 100);  // percentage 0–100
}

// ── NEW v2.0: Category-level scores ──────────────────────────────────────────
export function getCategoryScores(
  responses: Record<string, QuestionScore | number>,
  tier: 2 | 3,
  psychosocialApplicable = false,
  corApplicable = false
): Record<string, number | null> {
  const categoryMap: Record<string, { points: number; max: number }> = {};

  for (const domain of getDomainsForTier(tier)) {
    const cat = DOMAIN_CATEGORY_MAP[domain.id];
    if (!cat) continue;
    if (cat === 'Psychosocial Risk' && !psychosocialApplicable) continue;
    if (cat === 'Chain of Responsibility' && !corApplicable) continue;

    if (!categoryMap[cat]) categoryMap[cat] = { points: 0, max: 0 };

    for (const q of domain.questions.filter(q => q.tier === 'both' || q.tier === tier)) {
      if (responses[q.id] !== undefined) {
        categoryMap[cat].points += responses[q.id] || 0;
        categoryMap[cat].max    += 2;
      }
    }
  }

  const result: Record<string, number | null> = {};
  for (const [cat, { points, max }] of Object.entries(categoryMap)) {
    result[cat] = max > 0 ? Math.round((points / max) * 100) : null;
  }
  return result;
}

// ── NEW v2.0: Weighted overall score (replaces simple average) ───────────────
export function getWeightedOverallScore(
  responses: Record<string, QuestionScore | number>,
  tier: 2 | 3,
  psychosocialApplicable = false,
  corApplicable = false
): number {
  const catScores = getCategoryScores(responses, tier, psychosocialApplicable, corApplicable);

  const weights: Record<string, number> = {
    ...CATEGORY_WEIGHTS,
    ...(psychosocialApplicable ? { 'Psychosocial Risk': 10 } : {}),
    ...(corApplicable           ? { 'Chain of Responsibility': 5 } : {}),
  };

  // Redistribute to 100% if conditional categories are absent
  const totalBase = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalBase !== 100) {
    const surplus = 100 - totalBase;
    weights['Risk Management'] = (weights['Risk Management'] || 20) + surplus;
  }

  let weightedSum = 0, totalWeight = 0;
  for (const [cat, wt] of Object.entries(weights)) {
    const sc = catScores[cat];
    if (sc != null) {
      weightedSum  += sc * wt;
      totalWeight  += wt;
    }
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

// Backward-compat alias (used by submit route)
export function getOverallScore(
  responses: Record<string, number>,
  tier: 2 | 3
): number {
  return getWeightedOverallScore(responses, tier, false, false);
}

// ── NEW v2.0: Maturity label from percentage ──────────────────────────────────
export function getMaturityLabel(
  pct: number,
  hasCriticalRisks = false
): MaturityBand {
  if (hasCriticalRisks && pct >= 40) return '🟠 Basic';  // critical risk override
  if (pct >= 90) return '🔵 Leading';
  if (pct >= 75) return '🟢 Competent';
  if (pct >= 60) return '🟡 Developing';
  if (pct >= 40) return '🟠 Basic';
  return '🔴 Critical';
}

export function getBenchmarkPosition(pct: number): string {
  if (pct >= 90) return 'Top 10%';
  if (pct >= 75) return 'Top 30%';
  if (pct >= 60) return 'Average';
  if (pct >= 40) return 'Bottom 30%';
  return 'Bottom 10%';
}

// ── Triggers (threshold now 0 or 1 in 0/1/2 model) ───────────────────────────
export function getTriggersFromResponses(
  responses: Record<string, number>,
  tier: 2 | 3
): Array<{questionId: string; domain: string; risk: string; flag: string; legislation: string}> {
  const triggers = [];
  for (const domain of getDomainsForTier(tier)) {
    for (const q of domain.questions) {
      if (q.trigger && (q.tier === 'both' || q.tier === tier)) {
        const score = responses[q.id];
        // Fire if score is defined AND score <= threshold (0 or 1)
        if (score !== undefined && score <= q.trigger.threshold) {
          triggers.push({
            questionId:  q.id,
            domain:      domain.title,
            risk:        q.trigger.risk,
            flag:        q.trigger.flag,
            legislation: q.trigger.legislation,
          });
        }
      }
    }
  }
  return triggers.sort((a, b) => {
    const order: Record<string, number> = { Critical: 0, High: 1, Moderate: 2, Low: 3 };
    return (order[a.risk] ?? 3) - (order[b.risk] ?? 3);
  });
}

// ── D18: Fire & Emergency Equipment Inspection ────────────────────────────
// Key matching logic: fire hazard class → correct extinguisher type
// Class A (ordinary combustibles) → Water, Foam, Dry Powder, Wet Chemical
// Class B (flammable liquids)     → Foam, CO2, Dry Powder  (NOT water)
// Class C (flammable gases)       → Dry Powder ONLY         (NEVER water)
// Class D (combustible metals)    → Specialist Dry Powder ONLY
// Class E (electrical)            → CO2, Dry Powder          (NEVER water or foam)
// Class F (cooking oils/fats)     → Wet Chemical ONLY        (NOT water/CO2/powder)
// Regulatory: AS 1851:2012 (annual service) | AS/NZS 1841 (selection & installation)
//             BCA Spec E1.5 | WHS Reg 2025 Part 3.1 (work environment & facilities)
export const FIRE_EXTINGUISHER_CLASSES = {
  A: { hazard: 'Ordinary combustibles (wood, paper, cardboard, fabric, plastic)', agents: ['Water', 'Foam', 'Dry Powder', 'Wet Chemical'], notSuitable: [] },
  B: { hazard: 'Flammable liquids (petrol, diesel, oils, solvents, paint)', agents: ['Foam', 'CO2', 'Dry Powder'], notSuitable: ['Water — spreads burning liquid'] },
  C: { hazard: 'Flammable gases (LPG, acetylene, natural gas)', agents: ['Dry Powder'], notSuitable: ['Water — explosion risk', 'CO2 — may re-ignite', 'Foam — ineffective'] },
  D: { hazard: 'Combustible metals (magnesium, lithium, sodium, titanium)', agents: ['Specialist Dry Powder (Metal-X or equivalent)'], notSuitable: ['Water — violent reaction', 'CO2 — violent reaction', 'Standard Dry Powder — ineffective or dangerous'] },
  E: { hazard: 'Energised electrical equipment (switchboards, motors, computers, power tools)', agents: ['CO2', 'Dry Powder'], notSuitable: ['Water — electrocution risk', 'Foam — conductive, electrocution risk'] },
  F: { hazard: 'Cooking oils and fats (deep fryers, commercial cooking)', agents: ['Wet Chemical'], notSuitable: ['Water — violent explosion/steam', 'CO2 — ineffective', 'Dry Powder — contamination, re-ignition risk', 'Foam — may cause spattering'] },
} as const;

// Domain definition
const FIRE_EQUIPMENT_DOMAIN: AssessmentDomain = {
  id: 'fire_equipment',
  title: 'Fire & Emergency Equipment Inspection',
  isoClause: 'Cl. 8.2',
  legislation: 'WHS Reg 2025 Part 3.1 | WHS Act 2011 s.19 | AS 1851:2012 | BCA Spec E1.5',
  modelCoP: 'Emergency Plans CoP | Managing the Work Environment and Facilities CoP',
  description: 'Hazard-matched fire extinguisher inspection: identify fire hazard class in each area, verify correct extinguisher agent is present, inspect condition and service date. Includes fire blankets, signage, and access. AS 1851:2012 — annual service by licensed fire equipment technician.',
  tier: 'both',
  questions: [
    // Area hazard identification and extinguisher matching
    {
      id: 'FEE-001',
      text: 'Have all fire hazard classes been identified for each work area — Class A (combustibles), B (flammable liquids), C (gases), D (metals), E (electrical), F (cooking oils) — with the correct extinguisher type confirmed as present for each hazard?',
      context: 'AS/NZS 1841 — extinguisher selection must match fire hazard class. Using the wrong agent can escalate the fire (e.g. water on Class E = electrocution; water on Class F = violent steam explosion). Each area must be assessed for its specific fire hazard classes.',
      evidenceType: 'both',
      evidenceLabel: 'Upload fire hazard register by area, or photos showing area hazards and matching extinguisher type labels',
      tier: 'both',
      trigger: { threshold: 1, risk: 'Critical', flag: 'Fire extinguisher type not matched to fire hazard class — incorrect extinguisher may worsen a fire event', legislation: 'AS/NZS 1841 | WHS Act s.19' }
    },
    {
      id: 'FEE-002',
      text: 'Are all fire extinguishers serviced annually by a licensed fire equipment technician with a current service tag attached showing the technician licence number, service date, and next service due date? (AS 1851:2012)',
      context: 'AS 1851:2012 — annual service by licensed technician is mandatory. Service tags must show: technician licence number, date of service, next service due. Extinguishers >5 years old require pressure testing (hydrotest) every 5 years.',
      evidenceType: 'photo',
      evidenceLabel: 'Upload photo of extinguisher service tags clearly showing service date, technician licence number, and next due date',
      tier: 'both',
      trigger: { threshold: 1, risk: 'High', flag: 'Fire extinguisher annual service overdue or service tag missing — AS 1851:2012 non-compliance', legislation: 'AS 1851:2012 | WHS Act s.19' }
    },
    {
      id: 'FEE-003',
      text: 'Are all fire extinguishers in good physical condition — pressure gauge in green zone, safety pin intact and sealed, discharge hose undamaged, no visible corrosion or dents, anti-tamper seal intact?',
      context: 'AS 1851:2012 — monthly visual check recommended. Pressure gauge in red zone, missing pin, damaged hose, or broken seal indicates equipment may be non-functional. An extinguisher that fails in a fire event creates direct officer liability.',
      evidenceType: 'photo',
      evidenceLabel: 'Upload close-up photos showing pressure gauge reading, safety pin and seal, and hose/nozzle condition',
      tier: 'both',
      trigger: { threshold: 0, risk: 'Critical', flag: 'Fire extinguisher in poor condition — pressure gauge out of range, missing pin, or damaged hose. Equipment may not function in a fire.', legislation: 'AS 1851:2012 | WHS Act s.19' }
    },
    {
      id: 'FEE-004',
      text: 'Are fire extinguishers mounted at the correct height (handle between 900mm–1200mm from floor for portable units), clearly signposted with location signs, and free from obstruction with a clear 1-metre access zone?',
      context: 'AS/NZS 1841 — mounting height and signage requirements. BCA Spec E1.5 — access path to fire equipment must be kept clear. A fire extinguisher that cannot be reached or seen in a fire emergency provides no protection.',
      evidenceType: 'photo',
      evidenceLabel: 'Upload photo showing extinguisher mounting, location sign, and clear access zone',
      tier: 'both'
    },
    {
      id: 'FEE-005',
      text: 'Where fire blankets are provided (particularly in kitchen/cooking areas with Class F hazards): are they accessible, current within their recommended replacement period, and is the pull-tab/instruction label clearly visible and undamaged?',
      context: 'Fire blankets for Class F (cooking oil) fires are critical — water, CO2, and dry powder must NEVER be used on cooking oil fires. AS 3504 — fire blanket standard. Most manufacturers recommend replacement every 7 years or after any use.',
      evidenceType: 'photo',
      evidenceLabel: 'Upload photo of fire blanket, packaging condition, and visible instruction label',
      tier: 'both'
    },
    {
      id: 'FEE-006',
      text: 'Are fire detection systems (smoke detectors, heat detectors, sprinklers) tested at the required intervals — smoke detectors tested every 6 months per AS 1670.1, sprinkler systems inspected per AS 1851?',
      context: 'AS 1670.1 — fire detection and alarm systems. AS 1851:2012 — routine service of fire protection systems. Untested detection systems are a silent compliance failure often discovered only during a real fire event.',
      evidenceType: 'document',
      evidenceLabel: 'Upload fire detection system test records and sprinkler inspection records',
      tier: 'both'
    },
    // Tier 3: area-by-area matrix
    {
      id: 'FEE-007',
      text: 'Has a fire equipment register been completed for all areas — listing each extinguisher location, type (Class agent), manufacture date, service date, and next service due — with a site map showing extinguisher locations?',
      context: 'AS 1851:2012 and AS/NZS 1841 — fire equipment register is best practice and required for large premises. Manufacture date is critical: extinguishers manufactured >10 years ago require specialist assessment for continued service.',
      evidenceType: 'document',
      evidenceLabel: 'Upload fire equipment register and site plan showing extinguisher locations',
      tier: 3
    },
  ]
};

// ── D19: PPE Management & Inspection ──────────────────────────────────────
// Regulatory: WHS Act s.17-18 (HOC — PPE is last resort)
//             WHS Reg 2025 r.44 (PPE obligations)
//             AS/NZS 1801:1997 (hard hats — 5-year manufacture life)
//             AS/NZS 1891.4 (harnesses — 6-monthly formal inspection)
//             AS 1715 (respiratory protection — fit testing)
//             AS/NZS 4602 (high-visibility garments)
//             AS/NZS 1336 (eye and face protection)
const PPE_DOMAIN: AssessmentDomain = {
  id: 'ppe',
  title: 'PPE Management & Inspection',
  isoClause: 'Cl. 8.1',
  legislation: 'WHS Act 2011 s.17–18 (HOC) | WHS Reg 2025 r.44 | AS/NZS 1801 | AS/NZS 1891.4 | AS 1715',
  modelCoP: 'Hazardous Manual Tasks CoP | Managing Noise CoP | Managing Electrical Risks CoP',
  description: 'Hazard-based PPE selection, condition inspection, expiry date checking, fit testing, and training records. PPE is the LAST RESORT in the hierarchy of controls — assess whether higher-order controls should substitute the need for PPE first.',
  tier: 'both',
  desktopNote: 'Full PPE condition inspection requires physical inspection of actual PPE items. Desktop assessment can verify training records, purchase dates, and documented inspection systems. On-site Tier 3 assessment required for physical condition verification and fit-test records.',
  questions: [
    {
      id: 'PPE-001',
      text: 'Is PPE selection based on a documented hazard assessment — confirming that PPE is the appropriate control level for each hazard, and that higher-order controls (elimination, engineering) have been applied where reasonably practicable?',
      context: 'WHS Act s.17-18 — HOC: PPE is the last resort. PPE must be selected based on the specific hazard after higher-order controls have been maximised. Providing PPE without first applying engineering controls does NOT satisfy the SFAIRP duty.',
      evidenceType: 'document',
      evidenceLabel: 'Upload PPE hazard matrix or PPE selection records showing HOC assessment',
      tier: 'both',
      trigger: { threshold: 1, risk: 'High', flag: 'PPE selected without documented hazard assessment — higher-order controls may not have been considered. WHS Act s.17-18 exposure.', legislation: 'WHS Act 2011 s.17-18' }
    },
    {
      id: 'PPE-002',
      text: 'Are hard hats/safety helmets within their useful life? (Check inside: manufacture date stamp required per AS/NZS 1801. Replace: 5 years from manufacture date OR immediately after any impact, chemical splash, or if cracked, faded, or deformed.) Is the current condition — shell, suspension system, and ratchet — inspected regularly?',
      context: 'AS/NZS 1801:1997 — industrial safety helmets. Manufacture date is stamped inside the shell. 5-year maximum from manufacture date regardless of appearance. Suspension system typically replaced every 2 years. UV degradation makes faded helmets unsafe even if undamaged. An expired or damaged hard hat provides no protection.',
      evidenceType: 'photo',
      evidenceLabel: 'Upload photos of hard hat inside (date stamp visible), shell exterior, and suspension system condition',
      tier: 'both',
      trigger: { threshold: 0, risk: 'Critical', flag: 'Hard hat/safety helmet expired, damaged, or no manufacture date found — immediate replacement required', legislation: 'AS/NZS 1801:1997 | WHS Act s.19' }
    },
    {
      id: 'PPE-003',
      text: 'Are safety harnesses and fall arrest equipment inspected every 6 months by a competent person per AS/NZS 1891.4, with inspection records retained? Have harnesses been retired after any fall arrest event? (Harnesses that have arrested a fall MUST be removed from service immediately.)',
      context: 'AS/NZS 1891.4 — industrial fall arrest systems. 6-monthly inspection by competent person is mandatory. Retirement after fall arrest is mandatory — a harness that has arrested a fall is permanently compromised, even if no visible damage. Annual recertification by licensed inspector.',
      evidenceType: 'document',
      evidenceLabel: 'Upload harness inspection register with dates, inspector competency evidence, and retirement records',
      tier: 'both',
      trigger: { threshold: 0, risk: 'Critical', flag: 'Fall arrest harness inspection overdue or harness used in fall arrest not retired — immediate removal from service required', legislation: 'AS/NZS 1891.4 | WHS Reg 2025 r.78-100' }
    },
    {
      id: 'PPE-004',
      text: 'Are respiratory protection devices (P2/P3 masks, half-face respirators, supplied air) fit-tested for each individual user, stored correctly, inspected for seal integrity and filter currency, and are workers trained in correct donning, doffing, and seal check procedures?',
      context: 'AS 1715 — selection, use and maintenance of respiratory protective equipment. Fit testing is required for tight-fitting respirators — a respirator that does not fit leaks and provides no protection. P2 filter elements have limited service life — check manufacturer guidance. Facial hair prevents an effective seal on tight-fitting respirators.',
      evidenceType: 'both',
      evidenceLabel: 'Upload fit test records, respirator inspection log, and filter replacement schedule',
      tier: 'both'
    },
    {
      id: 'PPE-005',
      text: 'Is eye and face protection (safety glasses, goggles, face shields) rated appropriately for the hazard (impact, UV, chemical, welding), in good condition with no scratches, cracks or UV coating degradation, and replaced when damaged?',
      context: 'AS/NZS 1336 — eye and face protection. Scratched lenses reduce visibility and structural integrity. UV coating degradation means goggles that look intact provide no UV protection. Chemical splash requires goggles (not glasses). Arc welding requires welding-specific shade ratings.',
      evidenceType: 'photo',
      evidenceLabel: 'Upload photos of eye/face protection showing condition and markings (AS/NZS 1336 stamp)',
      tier: 'both'
    },
    {
      id: 'PPE-006',
      text: 'Are hearing protection devices (earmuffs, earplugs) rated to an appropriate NRR/SLC80 to reduce exposure below 85 dB(A), in good condition (no cracked cushions on earmuffs, no hardened foam earplugs), and worn consistently in Hearing Protection Zones?',
      context: 'WHS Reg 2025 r.57 | Managing Noise CoP — hearing protection is the last resort after engineering noise controls. SLC80 rating must be sufficient to protect against measured noise levels. Cracked earmuff cushions significantly reduce attenuation. Foam earplugs must be replaced when discoloured or hardened.',
      evidenceType: 'both',
      evidenceLabel: 'Upload hearing protection inspection records, SLC80 ratings compared to noise measurements, and photos of condition',
      tier: 'both'
    },
    {
      id: 'PPE-007',
      text: 'Are cut-resistant gloves rated appropriately for the cut hazard level (AS/NZS 2161.3 cut resistance levels A–F), chemical-resistant gloves selected for the specific chemical class (verify against SDS), and are gloves inspected for tears, punctures, or degradation before each use?',
      context: 'AS/NZS 2161 — occupational protective gloves. Cut resistance levels must match the hazard. Chemical-resistant gloves must be matched to the specific chemical — general-purpose gloves provide no chemical protection for many substances. Degraded gloves provide false protection.',
      evidenceType: 'photo',
      evidenceLabel: 'Upload photos of gloves showing marking/rating, and documented selection against chemical SDS or cut hazard assessment',
      tier: 'both'
    },
    {
      id: 'PPE-008',
      text: 'Are high-visibility garments compliant with AS/NZS 4602.1 Day/Night classification as required for the exposure (Class D for day only, Class DN for day and night near traffic), clean enough to maintain retroreflective strip effectiveness, and in good condition without fading or damage?',
      context: 'AS/NZS 4602.1 — high-visibility safety garments. Faded or dirty retroreflective strips lose their effectiveness. Day-only garments are insufficient for night-time road or traffic work — Class DN is required. Washing in too-hot water or with certain detergents degrades retroreflective material.',
      evidenceType: 'photo',
      evidenceLabel: 'Upload photos showing hi-vis class marking and current condition of garments and retroreflective strips',
      tier: 'both'
    },
    {
      id: 'PPE-009',
      text: 'Is there a documented PPE inspection and replacement register — recording each item issued, issue date, last inspection date, condition, and replacement date — and are workers trained in PPE inspection and replacement requirements before use?',
      context: 'WHS Reg 2025 r.44 — PCBU must provide, maintain, and replace PPE. ISO 45001:2018 Cl.7.2 — workers must be trained in PPE use, maintenance, and inspection. An undocumented PPE program is an underfended PPE program in any legal proceeding.',
      evidenceType: 'document',
      evidenceLabel: 'Upload PPE register, issue and inspection records, and training records for PPE use',
      tier: 'both',
      trigger: { threshold: 1, risk: 'Moderate', flag: 'No documented PPE inspection and replacement register — compliance with WHS Reg 2025 r.44 cannot be verified', legislation: 'WHS Reg 2025 r.44 | ISO 45001:2018 Cl.7.2' }
    },
    // Tier 3 — systematic PPE audit
    {
      id: 'PPE-010',
      text: 'Has a systematic PPE audit been conducted across all work areas — verifying that every worker has been issued appropriate PPE for their role, that all PPE is within service life, and that PPE is actually being worn in areas where it is required?',
      context: 'WHS Act s.19 — PCBU duty to provide and maintain PPE. On-site observations (Tier 3) must include verifying PPE is being worn — documented PPE programs that are not observed in practice are a common finding in serious incident investigations.',
      evidenceType: 'both',
      evidenceLabel: 'Upload PPE audit report with area-by-area findings, photos of workers using PPE, and non-compliance observations',
      tier: 3
    },
  ]
};

// ── Add new domains to the main registry ─────────────────────────────────────
ASSESSMENT_DOMAINS.push(FIRE_EQUIPMENT_DOMAIN, PPE_DOMAIN);

// ── Update DOMAIN_CATEGORY_MAP for new domains ────────────────────────────────
DOMAIN_CATEGORY_MAP['fire_equipment'] = 'Systems & Procedures';
DOMAIN_CATEGORY_MAP['ppe']            = 'Risk Management';

// ── Fire extinguisher matching helper ────────────────────────────────────────
// Use this to validate correct extinguisher type against identified fire hazard
export function getCorrectExtinguisherTypes(fireClass: keyof typeof FIRE_EXTINGUISHER_CLASSES): {
  hazard: string;
  correctAgents: readonly string[];
  incorrectAgents: readonly string[];
} {
  const data = FIRE_EXTINGUISHER_CLASSES[fireClass];
  return {
    hazard:         data.hazard,
    correctAgents:  data.agents,
    incorrectAgents: data.notSuitable,
  };
}

// Helper: validate an extinguisher type against a list of fire classes in an area
export function validateAreaFireEquipment(
  fireClassesPresent: Array<keyof typeof FIRE_EXTINGUISHER_CLASSES>,
  extinguishersAvailable: string[]
): { compliant: boolean; gaps: string[]; warnings: string[] } {
  const gaps: string[] = [];
  const warnings: string[] = [];

  for (const cls of fireClassesPresent) {
    const { hazard, correctAgents, incorrectAgents } = getCorrectExtinguisherTypes(cls);
    const hasCorrect = extinguishersAvailable.some(ext =>
      correctAgents.some(agent => ext.toLowerCase().includes(agent.toLowerCase()))
    );
    const hasIncorrect = extinguishersAvailable.some(ext =>
      incorrectAgents.some(wrong => {
        const agentName = wrong.split('—')[0].trim();
        return ext.toLowerCase().includes(agentName.toLowerCase());
      })
    );
    if (!hasCorrect) {
      gaps.push(`Class ${cls} (${hazard}): no suitable extinguisher available. Required: ${correctAgents.join(' or ')}`);
    }
    if (hasIncorrect) {
      const wrongOnes = incorrectAgents
        .filter(w => extinguishersAvailable.some(e => e.toLowerCase().includes(w.split('—')[0].trim().toLowerCase())))
        .join('; ');
      warnings.push(`Class ${cls} (${hazard}): INCORRECT extinguisher type present — ${wrongOnes}. This can worsen the fire.`);
    }
  }

  return { compliant: gaps.length === 0 && warnings.length === 0, gaps, warnings };
}

// ── PPE expiry helpers ────────────────────────────────────────────────────────
export interface PPEItem {
  type: string;
  manufactureDate?: Date;
  lastInspectionDate?: Date;
  usedInFallArrest?: boolean;
}

export function assessPPEStatus(item: PPEItem): {
  status: 'OK' | 'INSPECT' | 'REPLACE';
  reason?: string;
} {
  const now = new Date();

  if (item.type === 'hard_hat' && item.manufactureDate) {
    const ageYears = (now.getTime() - item.manufactureDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageYears >= 5) {
      return { status: 'REPLACE', reason: `Hard hat exceeded 5-year manufacture life (AS/NZS 1801). Manufacture date: ${item.manufactureDate.toLocaleDateString('en-AU')}` };
    }
    if (ageYears >= 4) {
      return { status: 'INSPECT', reason: `Hard hat approaching 5-year manufacture limit (AS/NZS 1801) — plan replacement` };
    }
  }

  if (item.type === 'harness') {
    if (item.usedInFallArrest) {
      return { status: 'REPLACE', reason: 'Harness MUST be retired after any fall arrest event (AS/NZS 1891.4) — remove from service immediately' };
    }
    if (item.lastInspectionDate) {
      const daysSinceInspection = (now.getTime() - item.lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceInspection > 183) { // 6 months
        return { status: 'INSPECT', reason: `Harness 6-monthly inspection overdue (AS/NZS 1891.4). Last inspection: ${item.lastInspectionDate.toLocaleDateString('en-AU')}` };
      }
    }
  }

  return { status: 'OK' };
}

// ── Assessment questions for new domains (for use in buildUserPrompt) ─────────
export const FIRE_AND_PPE_SYSTEM_PROMPT_RULES = `
FIRE & EMERGENCY EQUIPMENT ASSESSMENT RULES:
- CRITICAL: Verify extinguisher TYPE matches fire HAZARD CLASS in each area
  Class A (combustibles) → Water, Foam, Dry Powder, Wet Chemical
  Class B (flammable liquids) → Foam, CO2, Dry Powder (NEVER water)
  Class C (gases) → Dry Powder ONLY (NEVER water, CO2, or foam)
  Class D (metals) → Specialist Dry Powder ONLY (standard agents are dangerous)
  Class E (electrical) → CO2 or Dry Powder (NEVER water or foam — electrocution risk)
  Class F (cooking oils) → Wet Chemical ONLY (water causes violent explosion)
- Annual service by licensed technician mandatory per AS 1851:2012
- Service tag must show: technician licence number, service date, next due date
- Pressure gauge must be in green zone; safety pin and anti-tamper seal intact
- Extinguishers >10 years old may require special assessment or replacement
- Fire blankets are mandatory for Class F (cooking) areas
- Smoke detectors tested 6-monthly per AS 1670.1

PPE ASSESSMENT RULES:
- PPE is the LAST RESORT in the HOC — always note if higher-order controls should substitute
- Hard hats: 5-year maximum from MANUFACTURE DATE (inside stamp) per AS/NZS 1801 — not from purchase date
- Replace hard hats immediately if: cracked, faded, impact history, chemical splash, or sun-damaged
- Harnesses: 6-monthly formal inspection per AS/NZS 1891.4; immediate retirement after ANY fall arrest event
- Respirators: fit-test required for each individual user — a non-fitted respirator provides no protection
- Hi-vis garments: Class DN required for day AND night near traffic; faded retroreflective strips are non-compliant
- Chemical-resistant gloves: must be matched to specific chemical from SDS — general gloves ≠ protection
- Hearing protection: SLC80 rating must provide protection below 85 dB(A) exposure standard
`;

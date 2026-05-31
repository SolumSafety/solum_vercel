// ════════════════════════════════════════════════════════════════════════════
// SOLUM SAFETY CONSULTING — WHS ASSESSMENT SCHEMA
// Covers all 17 mandatory domains for Tier 2 (Desktop) and Tier 3 (Enterprise)
// All domains align to: WHS Act 2011 | WHS Reg 2025 (NSW) | Model CoPs | ISO 45001:2018
//
// ★ WHS Regulation 2025 (NSW) COMPLIANCE UPDATE — Commenced 22 August 2025
//   New/amended requirements addressed in this schema:
//   • Psychosocial risks — hierarchy of controls NOW MANDATORY (s.55C)
//   • Silica Worker Register — mandatory from 1 October 2025
//   • Lithium-ion battery emergency plans — 25,000 kg threshold
//   • Training provider authorisation — SafeWork NSW approval required
//   • Licensed demolition work — broadened definition
//   • 88 new penalty notice offences — increased penalty amounts
//
// Evidence types per question:
//   'photo'    — site photo evidence (Tier 3 field assessment)
//   'document' — policy, procedure, register, record upload
//   'both'     — either photo or document acceptable
//   'none'     — no evidence attachment required
// ════════════════════════════════════════════════════════════════════════════
 
export type EvidenceType = 'photo' | 'document' | 'both' | 'none';
export type RiskLevel = 'Critical' | 'High' | 'Moderate' | 'Low';
export type TierApplicability = 2 | 3 | 'both';
 
export interface AssessmentQuestion {
  id:           string;              // e.g. "GOV-001"
  text:         string;              // question text
  context:      string;              // why this matters / legislative basis
  evidenceType: EvidenceType;        // what evidence can be attached
  evidenceLabel: string;             // label shown on upload button
  tier:         TierApplicability;   // which tier this applies to
  trigger?: {                        // if score falls below threshold, fire a trigger
    threshold: number;
    risk: RiskLevel;
    flag: string;
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
 
// ── DOMAIN DEFINITIONS ──────────────────────────────────────────────────────
 
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
        trigger:{ threshold:2, risk:'High', flag:'WHS not integrated into business planning', legislation:'ISO 45001 Cl.5.1' } },
      { id:'GOV-006', text:'Has the organisation updated its compliance register and briefed managers on the 88 new WHS Regulation 2025 (NSW) penalty notice offences — including increased amounts for failure to notify SafeWork NSW of a notifiable incident ($12,500) and failure to comply with an Improvement Notice ($11,250)?', context:'WHS Reg 2025 (NSW) — 88 new penalty notice offences introduced. Failure to notify a notifiable incident now attracts $12,500 penalty. Managers must be aware of changes. Commenced 22 August 2025.', evidenceType:'document', evidenceLabel:'Upload compliance register or manager briefing record on 2025 penalty changes', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Compliance register not updated for WHS Reg 2025 penalty changes — exposure to increased penalties', legislation:'WHS Reg 2025 (NSW) — Commenced 22 Aug 2025' } },
    ]
  },
 
  // ── D02: Consultation & Communication ────────────────────────────────────
  {
    id: 'consultation', title: 'Consultation & Communication',
    isoClause: 'Cl. 5.4', legislation: 'WHS Act 2011 s.46–49',
    modelCoP: 'Work Health and Safety Consultation, Cooperation and Coordination',
    description: 'Worker consultation arrangements, consultation records, DWG and HSR.',
    tier: 'both',
    questions: [
      { id:'CON-001', text:'Are formal WHS consultation arrangements documented and implemented — including method, frequency and records of outcomes?', context:'WHS Act s.46 — PCBU must consult with workers on WHS matters. Consultation must be genuine and recorded.', evidenceType:'document', evidenceLabel:'Upload consultation records, toolbox talk sign-on sheets or meeting minutes', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'WHS consultation not established — WHS Act s.46 non-compliance', legislation:'WHS Act 2011 s.46' } },
      { id:'CON-002', text:'Are workers aware of how to raise a WHS concern and is there a documented process for escalation and resolution?', context:'WHS Act s.47 — workers must be given the opportunity to raise concerns and have them addressed.', evidenceType:'document', evidenceLabel:'Upload hazard reporting form or concern register', tier:'both' },
      { id:'CON-003', text:'Are WHS outcomes from consultation communicated back to workers in a timely and accessible way?', context:'ISO 45001 Cl.7.4 — communication of WHS information to workers.', evidenceType:'document', evidenceLabel:'Upload communication records or safety notice board photos', tier:'both' },
      { id:'CON-004', text:'Are there documented multi-employer coordination arrangements where the organisation shares a workplace with other PCBUs?', context:'WHS Act s.46 — PCBUs that share a workplace must consult, cooperate and coordinate with each other.', evidenceType:'document', evidenceLabel:'Upload site coordination agreement or principal contractor arrangement', tier:'both' },
      { id:'CON-005', text:'Are workers involved in developing and reviewing risk assessments, safe work procedures and incident investigation outcomes?', context:'ISO 45001 Cl.5.4 — worker participation in decision-making on WHS matters.', evidenceType:'both', evidenceLabel:'Upload sign-off records showing worker consultation on procedures', tier:3 },
    ]
  },
 
  // ── D03: Risk Management ─────────────────────────────────────────────────
  {
    id: 'risk', title: 'Hazard Identification & Risk Management',
    isoClause: 'Cl. 6.1', legislation: 'WHS Reg 2025 (NSW) r.32–44',
    modelCoP: 'How to Manage Work Health and Safety Risks',
    description: 'Hazard identification, risk assessment, hierarchy of controls, risk register.',
    tier: 'both',
    questions: [
      { id:'RISK-001', text:'Is there a documented hazard/risk register covering all work activities, updated when conditions or tasks change?', context:'WHS Reg 2025 r.36 — PCBU must identify hazards. r.38 — controls must be implemented. ISO 45001 Cl.6.1.2.', evidenceType:'document', evidenceLabel:'Upload hazard register or risk register', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'No documented hazard/risk register', legislation:'WHS Reg 2025 r.36' } },
      { id:'RISK-002', text:'Are risk assessments conducted systematically before new tasks, on new equipment, after incidents and when conditions change?', context:'WHS Reg 2025 r.36-38 — ongoing hazard identification and risk management obligation.', evidenceType:'document', evidenceLabel:'Upload risk assessment records or JSA/JHA documents', tier:'both' },
      { id:'RISK-003', text:'Are risk control measures applied using the hierarchy of controls — prioritising elimination over substitution, engineering, administrative and PPE?', context:'WHS Act s.17-18 — hierarchy of controls. Controls must be SFAIRP. ISO 45001 Cl.8.1.2.', evidenceType:'document', evidenceLabel:'Upload risk assessment showing hierarchy of controls applied', tier:'both' },
      { id:'RISK-004', text:'Are risk controls reviewed after any incident, near-miss or significant workplace change, with reviews documented?', context:'WHS Reg 2025 r.40 — duty to review and revise controls. ISO 45001 Cl.10.2.', evidenceType:'document', evidenceLabel:'Upload post-incident review records or control review log', tier:'both' },
      { id:'RISK-005', text:'Are residual risks communicated to all workers affected — including contractors — before work commences?', context:'ISO 45001 Cl.7.3 — workers must be aware of hazards and risks relevant to their work.', evidenceType:'both', evidenceLabel:'Upload briefing records, induction sign-on or pre-start meeting notes', tier:3 },
    ]
  },
 
  // ── D04: Training & Competency ───────────────────────────────────────────
  {
    id: 'training', title: 'Training, Competency & Induction',
    isoClause: 'Cl. 7.2', legislation: 'WHS Reg 2025 (NSW) r.39',
    modelCoP: 'Construction Work (induction requirements)',
    description: 'Worker induction, training records, competency verification, licence currency.',
    tier: 'both',
    questions: [
      { id:'TRN-001', text:'Is there a documented WHS induction process for all new workers, contractors and visitors — with completion recorded?', context:'WHS Reg 2025 r.39 — workers must be trained to perform work safely. Induction is fundamental.', evidenceType:'document', evidenceLabel:'Upload induction checklist, sign-on register or induction records', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Worker induction process not established or not recorded', legislation:'WHS Reg 2025 r.39' } },
      { id:'TRN-002', text:'Are competency requirements documented for all roles, with a training needs analysis conducted and training scheduled accordingly?', context:'ISO 45001 Cl.7.2 — competence must be determined, training provided and effectiveness evaluated.', evidenceType:'document', evidenceLabel:'Upload training needs analysis or competency framework', tier:'both' },
      { id:'TRN-003', text:'Are training records maintained for all workers — including licence expiry dates — with alerts when renewal is due?', context:'WHS Reg 2025 r.39 — competency must be maintained. Expired licences create regulatory exposure.', evidenceType:'document', evidenceLabel:'Upload training matrix or licence register', tier:'both' },
      { id:'TRN-004', text:'Is training effectiveness evaluated — through assessment, observation or feedback — and records of evaluation maintained?', context:'ISO 45001 Cl.7.2 — training effectiveness must be evaluated.', evidenceType:'document', evidenceLabel:'Upload training assessment records or post-training evaluation forms', tier:'both' },
      { id:'TRN-005', text:'Have all workers who operate plant requiring High Risk Work (HRW) licences been verified — with current licence records on file?', context:'WHS Reg 2025 r.130-142 — HRW licence required for: scaffolding, crane, forklift, EWP, rigging, pressure equipment.', evidenceType:'document', evidenceLabel:'Upload HRW licence register or copies of current licences', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'HRW licence verification not completed', legislation:'WHS Reg 2025 r.130-142' } },
      { id:'TRN-006', text:'Are all mandatory WHS training courses delivered by SafeWork NSW authorised training providers — with provider authorisation numbers recorded alongside training records? [WHS Reg 2025 NSW NEW REQUIREMENT]', context:'WHS Reg 2025 (NSW) — SafeWork NSW now has powers to authorise and revoke training providers and courses (commenced 22 Aug 2025). Using a non-authorised provider for mandatory training (asbestos, demolition, HRW, confined space) may render the training invalid. Provider authorisation numbers must be verified and recorded.', evidenceType:'document', evidenceLabel:'Upload training records showing SafeWork NSW authorised provider numbers for mandatory courses', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Mandatory training provider authorisation not verified — training may be invalid under WHS Reg 2025 training provider authorisation framework', legislation:'WHS Reg 2025 (NSW) — Training Provider Authorisation, commenced 22 Aug 2025' } },
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
        trigger:{ threshold:2, risk:'High', flag:'Root cause analysis not consistently conducted', legislation:'ISO 45001 Cl.10.2' } },
      { id:'INC-003', text:'Are corrective actions from incidents tracked through a register with owners, due dates and verification of close-out effectiveness?', context:'ISO 45001 Cl.10.2 — corrective action effectiveness must be reviewed.', evidenceType:'document', evidenceLabel:'Upload corrective action register showing close-out status', tier:'both' },
      { id:'INC-004', text:'Is there a documented procedure for identifying notifiable incidents — with clear SafeWork NSW notification steps (phone 13 10 50)?', context:'WHS Act s.36-38 — immediate notification of fatality, serious injury/illness or dangerous incident. Failure to notify: Category 2 offence.', evidenceType:'document', evidenceLabel:'Upload notifiable incident procedure or flowchart', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'Notifiable incident notification procedure not documented', legislation:'WHS Act 2011 s.38' } },
      { id:'INC-005', text:'Are incident trends analysed and reported to management/leadership quarterly, with patterns used to drive systemic improvements?', context:'ISO 45001 Cl.9.1 — performance evaluation. Trend analysis is a key leading/lagging indicator function.', evidenceType:'document', evidenceLabel:'Upload incident trend report or safety dashboard', tier:3 },
    ]
  },
 
  // ── D06: Emergency Management ─────────────────────────────────────────────
  {
    id: 'emergency', title: 'Emergency Management & Preparedness',
    isoClause: 'Cl. 8.2', legislation: 'WHS Reg 2025 (NSW) r.43; AS 3745',
    modelCoP: 'Emergency Plans',
    description: 'Emergency response plan, drills, wardens, first aid, evacuation procedures.',
    tier: 'both',
    questions: [
      { id:'EMG-001', text:'Is there a documented Emergency Response Plan (ERP) — covering evacuation, first aid, fire, and site-specific scenarios — reviewed in the last 12 months?', context:'WHS Reg 2025 r.43 — emergency plan required. Model CoP: Emergency Plans — plan must be site-specific and tested.', evidenceType:'document', evidenceLabel:'Upload Emergency Response Plan or Emergency Management Procedure', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Emergency Response Plan absent or not reviewed', legislation:'WHS Reg 2025 r.43' } },
      { id:'EMG-002', text:'Have emergency evacuation drills been conducted at least annually — with outcomes debriefed, documented and fed back into the ERP?', context:'AS 3745 and Model CoP: Emergency Plans — drills must be conducted and documented.', evidenceType:'both', evidenceLabel:'Upload drill records, debrief notes or evacuation report', tier:'both' },
      { id:'EMG-003', text:'Are emergency wardens appointed and trained — with current training records on file and roles communicated to all workers?', context:'AS 3745 — trained emergency wardens required. WHS Reg 2025 r.43.', evidenceType:'document', evidenceLabel:'Upload warden appointment records and training certificates', tier:'both' },
      { id:'EMG-004', text:'Are first aid kits stocked to required levels, with trained first aiders appointed at the correct ratio for the workplace size and risk?', context:'WHS Reg 2025 r.42 — first aid obligations. Model CoP: First Aid in the Workplace — ratio and kit requirements.', evidenceType:'both', evidenceLabel:'Upload first aid kit inspection record and first aider training certificates', tier:'both' },
      { id:'EMG-005', text:'Are emergency procedures and contact numbers posted at required locations, and are workers aware of their specific emergency roles?', context:'WHS Reg 2025 r.43 — emergency information must be accessible.', evidenceType:'photo', evidenceLabel:'Upload photo of emergency information posting at site', tier:3 },
      { id:'EMG-006', text:'Does the organisation store, handle or install lithium-ion batteries — and if yes, does it meet or exceed the 25,000 kg threshold requiring mandatory emergency plan lodgement with Fire and Rescue NSW including battery-fire scenarios? [WHS Reg 2025 NSW NEW REQUIREMENT]', context:'WHS Reg 2025 (NSW) — new NSW-specific requirement commenced 22 Aug 2025. Sites storing, handling or installing 25+ tonnes of lithium-ion batteries must lodge emergency plans with Fire and Rescue NSW covering battery-fire scenarios. Particularly relevant for: manufacturing, logistics, utilities, EV fleet operations, warehousing.', evidenceType:'document', evidenceLabel:'Upload lithium battery inventory record and emergency plan lodgement confirmation (if threshold met)', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Lithium-ion battery inventory not assessed for 25,000kg threshold — emergency plan lodgement obligation may exist under WHS Reg 2025 (NSW)', legislation:'WHS Reg 2025 (NSW) — Lithium Battery Emergency Planning, commenced 22 Aug 2025' } },
    ]
  },
 
  // ── D07: Plant & Equipment ───────────────────────────────────────────────
  {
    id: 'plant', title: 'Plant, Equipment & PPE',
    isoClause: 'Cl. 8.1', legislation: 'WHS Reg 2025 (NSW) r.203+; AS/NZS 3760',
    modelCoP: 'Managing the Risk of Plant in the Workplace',
    description: 'Plant register, pre-start inspections, maintenance, LOTO, PPE, design registration.',
    tier: 'both',
    questions: [
      { id:'PLT-001', text:'Is there a plant register covering all items of plant — with design registration numbers, inspection dates and maintenance records?', context:'WHS Reg 2025 r.203 — PCBU must manage risks of plant. Plant register required. r.210+ — design registration.', evidenceType:'document', evidenceLabel:'Upload plant register', tier:'both' },
      { id:'PLT-002', text:'Are pre-start inspection records completed before use of all relevant plant — with defects recorded, tagged out and rectified promptly?', context:'WHS Reg 2025 r.203 — ongoing management of plant in use. Defective plant must be tagged out.', evidenceType:'both', evidenceLabel:'Upload pre-start inspection forms or photos of tagged-out plant', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Pre-start inspection records incomplete or absent', legislation:'WHS Reg 2025 r.203' } },
      { id:'PLT-003', text:'Are isolation and lockout/tagout (LOTO) procedures documented and applied during maintenance and servicing of plant?', context:'WHS Reg 2025 r.203 — isolation requirements. Stored energy must be controlled before maintenance.', evidenceType:'both', evidenceLabel:'Upload LOTO procedure or photo of isolation point', tier:'both' },
      { id:'PLT-004', text:'Is correct PPE available, fit-for-purpose, in good condition and worn by workers — with PPE selected based on risk assessment outcomes?', context:'WHS Reg 2025 — PPE is the last resort in the hierarchy of controls but must be provided where required.', evidenceType:'both', evidenceLabel:'Upload PPE register or photo of PPE storage and condition', tier:3 },
      { id:'PLT-005', text:'Are all portable electrical appliances (PAE) tested and tagged per AS/NZS 3760 — with a current test and tag register maintained?', context:'AS/NZS 3760; WHS Reg 2025 r.211 — electrical equipment must be tested at required intervals.', evidenceType:'both', evidenceLabel:'Upload test & tag register or photo of tagged equipment', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Electrical test and tag non-compliant or register absent', legislation:'AS/NZS 3760; WHS Reg 2025' } },
    ]
  },
 
  // ── D08: Hazardous Chemicals ─────────────────────────────────────────────
  {
    id: 'chemicals', title: 'Hazardous Chemicals & Substances',
    isoClause: 'Cl. 8.1', legislation: 'WHS Reg 2025 (NSW) r.347+, r.573+',
    modelCoP: 'Managing Risks of Hazardous Chemicals in the Workplace; Safety Data Sheets',
    description: 'Chemical register, SDS currency, GHS labelling, storage, exposure standards.',
    tier: 'both',
    questions: [
      { id:'CHEM-001', text:'Is there a current chemical register listing all hazardous chemicals used, stored or generated on site — updated when products change?', context:'WHS Reg 2025 r.573 — chemical register required. Must be accessible to workers and emergency services.', evidenceType:'document', evidenceLabel:'Upload chemical register', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Chemical register absent or not current', legislation:'WHS Reg 2025 r.573' } },
      { id:'CHEM-002', text:'Are Safety Data Sheets (SDS) available at point of use for all hazardous chemicals — with SDS reviewed and current within 5 years?', context:'WHS Reg 2025 r.347 — SDS must be obtained, kept and accessible. SDS review cycle is 5 years per Model CoP.', evidenceType:'document', evidenceLabel:'Upload sample SDS with date verification or SDS management register', tier:'both' },
      { id:'CHEM-003', text:'Are all hazardous chemicals labelled in accordance with GHS requirements — including transported containers and decanted substances?', context:'WHS Reg 2025 r.347 — GHS labelling required. Model CoP: Labelling of Workplace Hazardous Chemicals.', evidenceType:'both', evidenceLabel:'Upload photo of chemical labelling in storage area or GHS compliance audit', tier:'both' },
      { id:'CHEM-004', text:'Are chemicals stored correctly — separated from incompatibles, bunded where required, ventilated and with spill response equipment accessible?', context:'Model CoP: Managing Risks of Hazardous Chemicals — storage, segregation and containment requirements.', evidenceType:'photo', evidenceLabel:'Upload photo of chemical storage area', tier:3 },
      { id:'CHEM-005', text:'Are exposure standards monitored where airborne chemicals are used — with health monitoring conducted where required?', context:'WHS Reg 2025 r.394 — exposure standards must not be exceeded. Health monitoring required for specified chemicals.', evidenceType:'document', evidenceLabel:'Upload air monitoring results or health monitoring records', tier:'both' },
      { id:'CHEM-006', text:'Does the organisation engage in any high-risk crystalline silica processing (stone benchtop fabrication, tunnelling, quarrying, abrasive blasting, demolition)? If yes — are all affected workers registered on the SafeWork NSW Silica Worker Register within 28 days of commencing work? [WHS Reg 2025 NSW NEW REQUIREMENT — from 1 Oct 2025]', context:'WHS Reg 2025 (NSW) — Silica Worker Register mandatory from 1 October 2025. PCBUs involved in high-risk crystalline silica processing must register workers on SafeWork NSW online register within 28 days. Non-compliance is a penalty notice offence and may impact negligence claims. Also triggers health monitoring obligations.', evidenceType:'document', evidenceLabel:'Upload SafeWork NSW Silica Worker Register confirmation OR written declaration that no high-risk silica processing is conducted', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'Silica Worker Register compliance not confirmed — mandatory obligation under WHS Reg 2025 (NSW) from 1 Oct 2025. Penalty notice offence.', legislation:'WHS Reg 2025 (NSW) — Silica Worker Register, from 1 Oct 2025' } },
      { id:'CHEM-007', text:'Where crystalline silica is present — are dust mitigation controls in place and audited, including wet methods, local exhaust ventilation (LEV), respiratory protective equipment (RPE) and periodic air monitoring?', context:'WHS Reg 2025 r.394 — exposure standards for respirable crystalline silica must not be exceeded. Model CoP: Managing Risks of Hazardous Chemicals. Silica exposure is the leading cause of occupational lung disease in Australia.', evidenceType:'both', evidenceLabel:'Upload dust mitigation audit records, air monitoring results or RPE fit-test records', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'Crystalline silica dust controls insufficient — exposure standard breach risk and Silica Worker Register obligation triggered', legislation:'WHS Reg 2025 r.394; Model CoP Hazardous Chemicals' } },
    ]
  },
 
  // ── D09: Document Control ─────────────────────────────────────────────────
  {
    id: 'documents', title: 'Document Control & WHS Records',
    isoClause: 'Cl. 7.5', legislation: 'WHS Reg 2025 (NSW) r.44',
    modelCoP: 'Work Health and Safety Management Systems',
    description: 'Document version control, record retention, accessibility, review cycles.',
    tier: 'both',
    questions: [
      { id:'DOC-001', text:'Are WHS documents version controlled — with current version number, review date and author recorded — and obsolete versions archived?', context:'ISO 45001 Cl.7.5 — documented information must be controlled. Outdated documents create compliance risk.', evidenceType:'document', evidenceLabel:'Upload document control register or sample procedure with version history', tier:'both' },
      { id:'DOC-002', text:'Are WHS records retained for the required periods — including training, incidents, risk assessments and inspection records?', context:'WHS Reg 2025 r.44 — records must be retained. ISO 45001 Cl.7.5.3 — retention and disposition.', evidenceType:'document', evidenceLabel:'Upload records retention schedule or document management system', tier:'both' },
      { id:'DOC-003', text:'Are workers consistently using the most current versions of WHS documents — with a process for notifying workers when documents are updated?', context:'ISO 45001 Cl.7.5 — documents available where needed in correct version.', evidenceType:'both', evidenceLabel:'Upload evidence of current document version in use at worksite', tier:'both' },
      { id:'DOC-004', text:'Are all WHS documents assigned a review date and review cycle — with a tracking process to ensure reviews are completed on time?', context:'ISO 45001 Cl.7.5 — documented information must be reviewed and updated as necessary.', evidenceType:'document', evidenceLabel:'Upload document review schedule or register showing review status', tier:'both' },
    ]
  },
 
  // ── D10: Psychosocial Risk ────────────────────────────────────────────────
  {
    id: 'psychosocial', title: 'Psychosocial Risk Management',
    isoClause: 'Cl. 6.1.2', legislation: 'WHS Reg 2025 (NSW) s.55A–55L',
    modelCoP: 'Managing Psychosocial Hazards at Work (SWA 2022)',
    description: 'Psychosocial hazard identification (15 Model CoP categories), control hierarchy, worker consultation, EAP.',
    tier: 'both',
    desktopNote: 'All findings are documentation-based. Worker psychological health outcomes and unreported psychosocial hazards cannot be assessed without direct worker engagement. A worker survey is strongly recommended.',
    questions: [
      { id:'PSY-001', text:'Has the organisation conducted a formal psychosocial hazard identification covering all 15 Model CoP Table 1 categories — with results documented?', context:'WHS Reg 2025 s.55B — PCBU must identify psychosocial hazards. All 15 Model CoP categories must be considered.', evidenceType:'document', evidenceLabel:'Upload psychosocial hazard register or PRA form', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'Psychosocial hazard identification not conducted — WHS Reg 2025 s.55A-55L non-compliance', legislation:'WHS Reg 2025 s.55B' } },
      { id:'PSY-002', text:'Are controls for identified psychosocial hazards applied using the 5-level hierarchy — starting with elimination or redesign — not defaulting to EAP as the first response?', context:'WHS Reg 2025 s.55C — hierarchy of controls mandated for psychosocial risks. EAP alone is insufficient.', evidenceType:'document', evidenceLabel:'Upload psychosocial control plan or risk register showing controls hierarchy', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'Hierarchy of controls not applied for psychosocial risks — WHS Reg 2025 s.55C', legislation:'WHS Reg 2025 s.55C' } },
      { id:'PSY-003', text:'Are workers specifically consulted on psychosocial hazards and proposed controls — separate from general WHS consultation — with consultation documented?', context:'WHS Act 2011 s.47-49 — workers must be consulted. WHS Reg 2025 s.55D — specific consultation obligation for psychosocial.', evidenceType:'document', evidenceLabel:'Upload psychosocial consultation records or worker survey results', tier:'both' },
      { id:'PSY-004', text:'Is there an Employee Assistance Program (EAP) or equivalent accessible to all workers — actively promoted and with usage data tracked?', context:'Model CoP Section 4 — EAP is a support control. Must accompany higher-order controls, not replace them.', evidenceType:'document', evidenceLabel:'Upload EAP provider agreement or promotion materials', tier:'both' },
      { id:'PSY-005', text:'Are psychosocial risks reviewed after changes to work design, after incidents/complaints involving psychological harm, and at minimum annually?', context:'WHS Reg 2025 s.55G — controls must be reviewed. ISO 45001 Cl.10.2 — corrective action effectiveness.', evidenceType:'document', evidenceLabel:'Upload review records or psychosocial risk register with review dates', tier:'both' },
      { id:'PSY-006', text:'Has the organisation implemented higher-order psychosocial controls — such as work redesign, exposure limits to traumatic content, supervision structures, and cultural measures — rather than relying on EAP or policy as primary controls? [WHS Reg 2025 NSW NEW REQUIREMENT]', context:'WHS Reg 2025 s.55C (amended 22 Aug 2025) — hierarchy of controls NOW MANDATED for psychosocial risks. Higher-order controls (those that do not require people to be effective) must be prioritised. EAP alone is NOT sufficient. Aligns NSW with QLD, ACT, NT, SA and Commonwealth.', evidenceType:'document', evidenceLabel:'Upload psychosocial control plan showing higher-order controls implemented (work design, exposure limits, supervision)', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'Higher-order psychosocial controls not implemented — WHS Reg 2025 s.55C non-compliance. EAP alone is insufficient under 2025 amendments.', legislation:'WHS Reg 2025 (NSW) s.55C — amended 22 Aug 2025' } },
      { id:'PSY-007', text:'Is the effectiveness of psychosocial controls specifically monitored and documented — with evidence that controls are actually reducing harm rather than merely existing on paper?', context:'WHS Reg 2025 s.55G — effectiveness review mandatory. Documenting controls without measuring effectiveness is insufficient. Worker feedback, incident trends and health monitoring are evidence of effectiveness.', evidenceType:'document', evidenceLabel:'Upload psychosocial control effectiveness review records, worker survey results or psychosocial KPI dashboard', tier:3,
        trigger:{ threshold:2, risk:'High', flag:'Psychosocial control effectiveness not monitored — risk of paper compliance only', legislation:'WHS Reg 2025 s.55G' } },
    ]
  },
 
  // ── D11: Contractor & Supply Chain ───────────────────────────────────────
  {
    id: 'contractors', title: 'Contractor & Supply Chain Safety',
    isoClause: 'Cl. 8.1.4', legislation: 'WHS Act 2011 s.20; WHS Reg 2025 r.291+',
    modelCoP: 'Construction Work; Work Health and Safety Consultation',
    description: 'Contractor pre-qualification, site induction, WHS documentation, performance monitoring, coordination.',
    tier: 'both',
    questions: [
      { id:'CON-CTR-001', text:'Is there a contractor pre-qualification process — assessing WHS capability, licence currency and insurance before engagement?', context:'WHS Act s.20 — PCBU duty to non-workers. Contractor pre-qualification is a key due diligence control.', evidenceType:'document', evidenceLabel:'Upload contractor pre-qualification checklist or approved contractor register', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'No contractor pre-qualification process — WHS Act s.20 duty exposure', legislation:'WHS Act 2011 s.20' } },
      { id:'CON-CTR-002', text:'Do all contractors complete a site-specific induction before commencing work — with induction completion recorded for each person?', context:'WHS Reg 2025 r.39 — all workers must be trained. Contractor site induction is mandatory.', evidenceType:'document', evidenceLabel:'Upload contractor induction records or sign-on register', tier:'both' },
      { id:'CON-CTR-003', text:'Is contractor WHS documentation (SWMS, policies, licences) reviewed for adequacy before work commences — not just received?', context:'WHS Reg 2025 r.299 — SWMS must be reviewed. Receiving a SWMS without reviewing adequacy is insufficient.', evidenceType:'document', evidenceLabel:'Upload SWMS review checklist or contractor document approval record', tier:'both' },
      { id:'CON-CTR-004', text:'Is contractor WHS performance monitored during work — including SWMS compliance, housekeeping and incident reporting — with findings documented?', context:'WHS Act s.20 — PCBU must ensure safety of all persons affected by work activities.', evidenceType:'both', evidenceLabel:'Upload contractor performance monitoring records or site inspection photos', tier:3 },
      { id:'CON-CTR-005', text:'Where multiple PCBUs share a workplace, are documented coordination arrangements in place covering WHS responsibilities, communication and incident reporting?', context:'WHS Act s.46 — PCBUs sharing a workplace must consult, cooperate and coordinate. Multi-employer WHS coordination plan required.', evidenceType:'document', evidenceLabel:'Upload multi-employer WHS coordination agreement or principal contractor plan', tier:'both' },
      { id:'CON-CTR-006', text:'Has the organisation reviewed whether any demolition, strip-out or refurbishment activities fall within the broadened definition of "licensed demolition work" under WHS Reg 2025 — and are all contractors verified as holding the correct demolition licence class with compliant supervision arrangements? [WHS Reg 2025 NSW NEW REQUIREMENT]', context:'WHS Reg 2025 (NSW) — broadened definition of licensed demolition work and clarified supervision requirements commenced 22 Aug 2025. More work now falls within the licensed category. Contractors must hold appropriate licence class and supervision must be verified. Contractual terms should be updated accordingly.', evidenceType:'document', evidenceLabel:'Upload contractor demolition licence verification records and/or demolition scope assessment', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Demolition licence scope not reviewed under 2025 broadened definition — contractor licence class and supervision compliance may be insufficient', legislation:'WHS Reg 2025 (NSW) — Licensed Demolition Work, commenced 22 Aug 2025' } },
    ]
  },
 
  // ── D12: Safe Work Procedures & SWMS ─────────────────────────────────────
  {
    id: 'swms', title: 'Safe Work Procedures & SWMS',
    isoClause: 'Cl. 8.1', legislation: 'WHS Reg 2025 (NSW) r.299–302',
    modelCoP: 'Safe Work Method Statements; Construction Work',
    description: 'SWMS for all HRCW, adequacy assessment, worker consultation, version control.',
    tier: 'both',
    questions: [
      { id:'SWMS-001', text:'Has the organisation identified all High Risk Construction Work (HRCW) activities — and is there a current, adequate SWMS for each?', context:'WHS Reg 2025 r.291, r.299 — SWMS required for all HRCW. 18 HRCW categories defined in Schedule 2.', evidenceType:'document', evidenceLabel:'Upload HRCW identification list and SWMS index', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'HRCW identified without SWMS — WHS Reg 2025 r.299 non-compliance', legislation:'WHS Reg 2025 r.299' } },
      { id:'SWMS-002', text:'Do all SWMS include: work description, HRCW identification, hazard identification, risk rating, controls using the hierarchy, residual risk and responsible persons?', context:'WHS Reg 2025 r.300 — minimum SWMS content requirements. A SWMS that does not meet minimum content is non-compliant.', evidenceType:'document', evidenceLabel:'Upload sample SWMS for adequacy review', tier:'both' },
      { id:'SWMS-003', text:'Were workers who will carry out the work consulted in the preparation of the SWMS — with consultation documented by worker signature?', context:'WHS Reg 2025 r.299(3) — workers must be consulted in SWMS preparation. This is a specific legislative requirement.', evidenceType:'document', evidenceLabel:'Upload SWMS with worker consultation sign-off', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Worker consultation not documented in SWMS preparation — WHS Reg 2025 r.299(3)', legislation:'WHS Reg 2025 r.299(3)' } },
      { id:'SWMS-004', text:'Are SWMS reviewed and updated when work methods change, after an incident, or at least annually — with version history maintained?', context:'WHS Reg 2025 r.302 — SWMS must be kept up to date. Version control essential for compliance.', evidenceType:'document', evidenceLabel:'Upload SWMS version history or document control register', tier:'both' },
      { id:'SWMS-005', text:'Are safe work procedures available at the worksite for workers to access, and do workers demonstrate understanding of the relevant procedure?', context:'WHS Reg 2025 r.301 — SWMS must be kept at the workplace where work is carried out.', evidenceType:'both', evidenceLabel:'Upload photo of SWMS at worksite or worker acknowledgement records', tier:3 },
    ]
  },
 
  // ── D13: Officer Due Diligence ────────────────────────────────────────────
  {
    id: 'officer_dd', title: 'Officer Due Diligence (WHS Act s.27)',
    isoClause: 'Cl. 5.1', legislation: 'WHS Act 2011 s.27 — 6 statutory elements',
    description: 'All 6 statutory due diligence elements: knowledge, operations, resources, information, processes, verification.',
    tier: 'both',
    desktopNote: 'All findings are documentation-based. Actual officer engagement and WHS knowledge may exceed what is documented. Officers should seek independent legal advice on personal obligations.',
    questions: [
      { id:'ODD-001', text:'Do officers of the PCBU acquire and maintain up-to-date knowledge of WHS matters — through training, external briefings, industry publications or expert advice?', context:'WHS Act s.27(a) — officers must acquire and keep up to date knowledge of WHS matters. Personal obligation.', evidenceType:'document', evidenceLabel:'Upload officer WHS training records, CPD certificates or expert briefing notes', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'Officer WHS knowledge acquisition not evidenced — WHS Act s.27(a)', legislation:'WHS Act 2011 s.27(a)' } },
      { id:'ODD-002', text:'Do officers gain and maintain an understanding of the organisation\'s operations — including the nature, scale and associated WHS hazards and risks?', context:'WHS Act s.27(b) — officers must understand operations. Board-level visibility of operational hazards is essential.', evidenceType:'document', evidenceLabel:'Upload board/management WHS risk briefing, site visit records or hazard profile review evidence', tier:'both' },
      { id:'ODD-003', text:'Do officers ensure the PCBU has appropriate resources and processes available — including budget, personnel, specialist access and systems — to manage WHS?', context:'WHS Act s.27(c) — officers must ensure resources. WHS budget, dedicated WHS personnel, and specialist access are key indicators.', evidenceType:'document', evidenceLabel:'Upload WHS budget allocation, organisation chart showing WHS resources', tier:'both' },
      { id:'ODD-004', text:'Do officers ensure there are processes for receiving, reviewing and responding to WHS information — including incidents, audits, KPIs and regulatory updates?', context:'WHS Act s.27(d) — officers must receive and consider WHS information. Structured board WHS reporting is required.', evidenceType:'document', evidenceLabel:'Upload board WHS reports, management KPI dashboard or meeting minutes with WHS agenda', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'No structured WHS reporting to officers — WHS Act s.27(d)', legislation:'WHS Act 2011 s.27(d)' } },
      { id:'ODD-005', text:'Do officers verify that the resources and processes required under their due diligence obligations are actually functioning as intended — not just documented?', context:'WHS Act s.27(f) — officers must verify. Reliance on reports alone is not verification. Independent audits, site visits and direct worker engagement are key methods.', evidenceType:'document', evidenceLabel:'Upload independent audit reports, officer site visit records or compliance verification evidence', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'No officer compliance verification — WHS Act s.27(f). Personal liability exposure.', legislation:'WHS Act 2011 s.27(f)' } },
    ]
  },
 
  // ── D14: HSR & Worker Representation ─────────────────────────────────────
  {
    id: 'hsr', title: 'HSR & Worker Representation',
    isoClause: 'Cl. 5.4', legislation: 'WHS Act 2011 s.51–72',
    description: 'DWG establishment, HSR elections, HSR training, issue resolution procedures, HSR powers.',
    tier: 'both',
    desktopNote: 'Worker experience of HSR effectiveness cannot be confirmed from documentation alone. On-site worker consultation recommended.',
    questions: [
      { id:'HSR-001', text:'Are Designated Work Groups (DWGs) established — or has the organisation confirmed that workers have not requested DWG establishment?', context:'WHS Act s.51-63 — workers may request DWG establishment. PCBU must negotiate and facilitate.', evidenceType:'document', evidenceLabel:'Upload DWG establishment records or written evidence that workers have not requested DWG', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'DWG establishment status not confirmed — WHS Act s.51-63', legislation:'WHS Act 2011 s.51' } },
      { id:'HSR-002', text:'Have Health and Safety Representatives (HSRs) been elected for each DWG — with election records on file and HSR identity communicated to all workers?', context:'WHS Act s.64-72 — HSR election process. HSRs serve a 3-year term. Workers must know who their HSR is.', evidenceType:'document', evidenceLabel:'Upload HSR election records and HSR notice issued to workers', tier:'both' },
      { id:'HSR-003', text:'Have elected HSRs completed an approved HSR training course within 3 months of election — with training completion records maintained?', context:'WHS Act s.72 — PCBU must allow HSRs to attend approved training within 3 months. This is a non-negotiable obligation.', evidenceType:'document', evidenceLabel:'Upload HSR training completion certificates', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'HSR training not completed within 3 months of election — WHS Act s.72 breach', legislation:'WHS Act 2011 s.72' } },
      { id:'HSR-004', text:'Is there a documented issue resolution procedure covering: how issues are raised, steps for resolution, timeframes and escalation?', context:'WHS Act s.76 — HSR may require resolution of WHS issue. Procedure must exist.', evidenceType:'document', evidenceLabel:'Upload issue resolution procedure', tier:'both' },
    ]
  },
 
  // ── D15: Notifiable Incidents ─────────────────────────────────────────────
  {
    id: 'notifiable', title: 'Notifiable Incidents & Regulatory Reporting',
    isoClause: 'Cl. 10.2', legislation: 'WHS Act 2011 s.35–38; WHS Reg r.695–700',
    description: 'Notifiable incident identification, scene preservation, SafeWork NSW notification, post-incident investigation.',
    tier: 'both',
    questions: [
      { id:'NOT-001', text:'Do all managers and supervisors know the 3 categories of notifiable incidents — death, serious injury/illness, dangerous incident — and their notification obligations?', context:'WHS Act s.35-37 — notifiable incident categories. Failure to notify: Category 2 offence. Training essential.', evidenceType:'document', evidenceLabel:'Upload manager training records on notifiable incidents or awareness assessment', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'Notifiable incident category awareness not confirmed — WHS Act s.36-38', legislation:'WHS Act 2011 s.36-38' } },
      { id:'NOT-002', text:'Is there a documented scene preservation procedure — ensuring the site of a notifiable incident is not disturbed until SafeWork NSW grants permission?', context:'WHS Act s.39 — duty to preserve scene. Failure to preserve: separate offence. Verbal instruction is insufficient.', evidenceType:'document', evidenceLabel:'Upload scene preservation procedure or incident response flowchart', tier:'both',
        trigger:{ threshold:2, risk:'Critical', flag:'Scene preservation procedure not documented — WHS Act s.39 breach risk', legislation:'WHS Act 2011 s.39' } },
      { id:'NOT-003', text:'Is SafeWork NSW notification (13 10 50) integrated into the incident management procedure — with written notification within 48 hours also documented?', context:'WHS Act s.38 — immediate telephone notification, then written within 48 hours. Both steps must be documented.', evidenceType:'document', evidenceLabel:'Upload incident management procedure showing notification steps', tier:'both' },
      { id:'NOT-004', text:'Are incident investigations reviewed to confirm no notifiable incidents have been incorrectly classified — with a periodic audit of the incident register?', context:'Under-classification risk — dangerous incidents in particular are often not recognised. Periodic audit reduces liability.', evidenceType:'document', evidenceLabel:'Upload incident register audit record or review checklist', tier:'both' },
    ]
  },
 
  // ── D16: Fatigue & Hours of Work ─────────────────────────────────────────
  {
    id: 'fatigue', title: 'Fatigue & Hours of Work',
    isoClause: 'Cl. 6.1.2', legislation: 'WHS Reg 2025 (NSW) r.48; Road Transport legislation',
    modelCoP: 'Fatigue Management',
    description: 'Hours of work policy, fatigue risk factors, roster design, driver fatigue management, fatigue KPIs.',
    tier: 'both',
    questions: [
      { id:'FAT-001', text:'Is there a documented fatigue management policy or procedure — covering maximum hours, minimum rest periods, shift design principles and fatigue reporting?', context:'WHS Reg 2025 r.48 — PCBU must manage risks of remote and isolated work including fatigue. Model CoP: Fatigue Management.', evidenceType:'document', evidenceLabel:'Upload fatigue management policy or hours of work procedure', tier:'both',
        trigger:{ threshold:2, risk:'High', flag:'Fatigue management policy absent', legislation:'WHS Reg 2025 r.48; Model CoP: Fatigue' } },
      { id:'FAT-002', text:'Are rosters designed to minimise fatigue risk — avoiding excessive consecutive shifts, short turnarounds and night/early morning start combinations?', context:'Model CoP: Fatigue — roster design is a key engineering/administrative control. Fatigue is a psychosocial hazard under WHS Reg 2025 s.55A.', evidenceType:'document', evidenceLabel:'Upload roster examples or roster design guidelines', tier:'both' },
      { id:'FAT-003', text:'For operations involving driving — are driver fatigue obligations understood and managed, with compliance with Chain of Responsibility (CoR) obligations for heavy vehicles?', context:'Heavy Vehicle National Law — Chain of Responsibility obligations. WHS Reg 2025 r.48 — remote/isolated work fatigue risk.', evidenceType:'document', evidenceLabel:'Upload driver fatigue policy, logbook records or CoR compliance documentation', tier:'both' },
      { id:'FAT-004', text:'Are fatigue-related incidents and near-misses tracked as a specific category — and is fatigue included as a potential contributing factor in all incident investigations?', context:'Model CoP: Fatigue — fatigue must be identified as a root cause where relevant. Tracking creates visibility.', evidenceType:'document', evidenceLabel:'Upload incident register showing fatigue category or investigation records', tier:'both' },
    ]
  },
 
  // ── D17: Office / Physical Workplace (Tier 3 only) ───────────────────────
  {
    id: 'office_ra', title: 'Physical Workplace & Office Risk Assessment',
    isoClause: 'Cl. 8.1', legislation: 'WHS Act 2011 s.19; WHS Reg 2025 r.44; AS/NZS 3590, 1680, 2293',
    modelCoP: 'Managing the Work Environment and Facilities',
    description: 'Ergonomics, lighting, emergency signage, electrical, housekeeping, noise, air quality. Requires site visit.',
    tier: 3,
    desktopNote: 'Physical workplace assessment cannot be conducted by desktop review. Tier 3 field assessment or standalone Office Risk Assessment (ORA) required.',
    questions: [
      { id:'ORA-001', text:'Are workstations assessed and set up to AS/NZS 3590 — correct monitor height and distance, chair adjustment, keyboard position, wrist posture, with screen breaks in place?', context:'Model CoP: Hazardous Manual Tasks; AS/NZS 3590 — workstation ergonomic standards.', evidenceType:'photo', evidenceLabel:'Upload workstation assessment photo or ORA ergonomics checklist', tier:3 },
      { id:'ORA-002', text:'Is lighting at or above the required level (320 lux minimum for office tasks per AS/NZS 1680) — with emergency lighting functional and tested?', context:'AS/NZS 1680 — lighting standard. AS/NZS 2293 — emergency lighting. WHS Act s.19.', evidenceType:'both', evidenceLabel:'Upload lighting measurement record or photo of lighting conditions and emergency light', tier:3 },
      { id:'ORA-003', text:'Are all portable electrical appliances tested and tagged per AS/NZS 3760 — and are switchboards accessible and RCDs installed and tested?', context:'AS/NZS 3760 — PAE test & tag. WHS Reg 2025 r.211. RCDs required in most office environments.', evidenceType:'both', evidenceLabel:'Upload test & tag register or photo of tagged equipment and switchboard', tier:3 },
      { id:'ORA-004', text:'Are fire extinguishers serviced per AS 1851, exit signs lit per AS/NZS 2293, and evacuation diagrams posted at required locations?', context:'AS 1851 — fire equipment maintenance. AS/NZS 2293 — exit signs. BCA emergency requirements.', evidenceType:'photo', evidenceLabel:'Upload photo of fire equipment, exit signs and evacuation diagram postings', tier:3 },
      { id:'ORA-005', text:'Is the workplace free from slip, trip and fall hazards — cables managed, anti-slip at entries, wet floor signage used — with housekeeping maintained to standard?', context:'WHS Act s.19; Model CoP: Managing the Work Environment and Facilities.', evidenceType:'photo', evidenceLabel:'Upload photo of work area showing housekeeping and slip/trip controls', tier:3 },
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
 
export function getTriggersFromResponses(
  responses: Record<string, number>,
  tier: 2 | 3
): Array<{questionId: string; domain: string; risk: string; flag: string; legislation: string}> {
  const triggers = [];
  for (const domain of getDomainsForTier(tier)) {
    for (const q of domain.questions) {
      if (q.trigger && (q.tier === 'both' || q.tier === tier)) {
        const score = responses[q.id];
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
    const order = { Critical: 0, High: 1, Moderate: 2, Low: 3 };
    return (order[a.risk as RiskLevel] || 3) - (order[b.risk as RiskLevel] || 3);
  });
}
 
export function getDomainScore(domainId: string, responses: Record<string, number>, tier: 2 | 3): number | null {
  const domain = ASSESSMENT_DOMAINS.find(d => d.id === domainId);
  if (!domain) return null;
  const scores = domain.questions
    .filter(q => q.tier === 'both' || q.tier === tier)
    .map(q => responses[q.id])
    .filter((s): s is number => s !== undefined && s > 0);
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}
 
export function getOverallScore(responses: Record<string, number>, tier: 2 | 3): number {
  const domains = getDomainsForTier(tier);
  const domainScores = domains
    .map(d => getDomainScore(d.id, responses, tier))
    .filter((s): s is number => s !== null);
  return domainScores.length ? domainScores.reduce((a, b) => a + b, 0) / domainScores.length : 0;
}
 

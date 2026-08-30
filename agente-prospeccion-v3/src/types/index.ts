export type LeadStatus =
  | 'INGESTED'
  | 'AUDITED_QUALIFIED'
  | 'DISCARDED'
  | 'AUDIT_FAILED'
  | 'PROPOSAL_COMPILED'
  | 'DEMO_DEPLOYED'
  | 'READY_TO_SEND'
  | 'FLAGGED_FOR_REVIEW'
  | 'QUEUED'
  | 'SENT'
  | 'FOLLOWUP_SENT'
  | 'FOLLOWUP_2'
  | 'COLD'
  | 'REPLIED'
  | 'HUMAN_HANDOFF'
  | 'WON'
  | 'LOST';

export interface ProspectLead {
  id: string;
  place_id: string;
  business_name: string;
  niche?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  google_maps_url?: string;
  rating?: number;
  reviews_count?: number;
  current_website_url?: string;
  status: LeadStatus;
  retry_count: number;
  do_not_contact: boolean;
  assigned_closer?: string;
  created_at: string;
  updated_at: string;
}

export type OpportunityType =
  | 'NEW_WEBSITE'
  | 'MODERNIZATION'
  | 'PERFORMANCE_OVERHAUL'
  | 'SYSTEM_INTEGRATION';

export interface DetectedTechStack {
  cms?: string[];
  page_builders?: string[];
  ecommerce?: string[];
  analytics?: string[];
  js_frameworks?: string[];
  css_frameworks?: string[];
  web_server?: string;
  is_outdated_stack: boolean;
  details: string[];
}

export interface AuditDiagnostics {
  id: string;
  lead_id: string;
  has_website: boolean;
  is_mobile_responsive: boolean;
  lighthouse_perf_score: number; // 0 - 100
  ttfb_ms: number;
  load_time_ms?: number;
  screenshot_path?: string;
  detected_tech_stack: DetectedTechStack;
  ai_opportunity_type?: OpportunityType;
  demo_url_deployed?: string;
  issues_found: string[];
  created_at: string;
}

export interface OpportunityReport {
  lead_id: string;
  opportunity_type: OpportunityType;
  priority_score: number; // 1 - 10
  pain_points: string[];
  proposed_solution: string;
  outreach_copy: {
    whatsapp_pitch: string;
    email_subject: string;
    email_body: string;
  };
}

export interface OutreachResult {
  id: string;
  lead_id: string;
  channel: 'whatsapp' | 'email' | 'linkedin';
  sent_at: string;
  replied: boolean;
  converted: boolean;
  copy_used: string;
  notes?: string;
}

export interface DomainHealth {
  id: string;
  domain: string;
  bounce_rate_24h: number;
  spam_complaints: number;
  circuit_breaker_active: boolean;
  checked_at: string;
}

export interface GateValidationResult {
  passed: boolean;
  reasons: string[];
}

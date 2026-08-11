import { InfoDoc, LEGAL_DOCS } from './legalDocs';
import { SAFETY_DOCS } from './safetyDocs';
import { SUPPORT_DOCS } from './supportDocs';
import { COMPANY_DOCS } from './companyDocs';

export type { InfoDoc, InfoSection } from './legalDocs';

export const ALL_INFO_DOCS: InfoDoc[] = [
  ...LEGAL_DOCS,
  ...SAFETY_DOCS,
  ...SUPPORT_DOCS,
  ...COMPANY_DOCS
];

export interface DocCategoryMeta {
  id: 'legal' | 'safety' | 'support' | 'company';
  name: string;
  description: string;
  iconName: string;
}

export const CATEGORIES_META: DocCategoryMeta[] = [
  {
    id: 'legal',
    name: 'Legal & Policies',
    description: 'Master terms, user privacy, cookies, and regulatory compliance.',
    iconName: 'FileText'
  },
  {
    id: 'safety',
    name: 'Trust & Safety',
    description: 'Agent verification, listing quality, review integrity, and scam prevention.',
    iconName: 'ShieldCheck'
  },
  {
    id: 'support',
    name: 'Support & Help',
    description: 'Help center guides, FAQs, direct contact, and bug reporting.',
    iconName: 'HelpCircle'
  },
  {
    id: 'company',
    name: 'Company & About',
    description: 'About Dormiqa, mission, vision, agent partner guide, careers, and press.',
    iconName: 'Building'
  }
];

export function getDocsByCategory(category: string): InfoDoc[] {
  return ALL_INFO_DOCS.filter(doc => doc.category === category);
}

export function getDocById(docId: string): InfoDoc | undefined {
  return ALL_INFO_DOCS.find(doc => doc.id === docId);
}

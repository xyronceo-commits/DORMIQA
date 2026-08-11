import { InfoDoc } from './legalDocs';

export const SUPPORT_DOCS: InfoDoc[] = [
  {
    id: 'help-centre',
    category: 'support',
    title: 'Help Centre',
    subtitle: 'Guides, walkthroughs, and resources for students and property agents.',
    lastUpdated: 'August 1, 2026',
    iconName: 'HelpCircle',
    sections: [
      {
        title: '1. Getting Started for Students',
        content: [
          'Find student housing in 3 easy steps: (1) Select your university campus; (2) Filter by accommodation type, price, and facility tags; (3) Click "Schedule Inspection" to meet the verified agent at the property gate.'
        ]
      },
      {
        title: '2. Getting Started for Agents & Landlords',
        content: [
          'List student accommodation: (1) Register as an Agent; (2) Complete identity verification with your government ID; (3) Upload property photos, location, and pricing details; (4) Receive direct student inspection requests.'
        ]
      },
      {
        title: '3. Inspection Safety Tips',
        content: [
          'Always inspect the property physically in daylight, test taps and sockets, confirm water flow, and speak with existing student tenants in the compound before transferring any rent.'
        ]
      }
    ]
  },
  {
    id: 'faq',
    category: 'support',
    title: 'Frequently Asked Questions (FAQ)',
    subtitle: 'Quick answers to top questions asked by students, agents, and parents.',
    lastUpdated: 'August 1, 2026',
    iconName: 'MessageSquare',
    sections: [
      {
        title: 'Q: Does Dormiqa charge students for searching or inspecting properties?',
        content: [
          'A: No! Searching listings, bookmarking properties, and requesting inspection appointments on Dormiqa is 100% free for students.'
        ]
      },
      {
        title: 'Q: Do I pay rent to Dormiqa or directly to the landlord/agent?',
        content: [
          'A: Rent payments are made DIRECTLY to the landlord or verified agent after you have physically inspected the property and agreed on tenancy terms. Dormiqa NEVER collects, holds, or processes rent payments.'
        ]
      },
      {
        title: 'Q: How do I know if an agent is verified?',
        content: [
          'A: Look for the green "Verified Agent" badge next to the agent’s profile and listing title. Verified agents have submitted government photo ID and proof of property management authorization.'
        ]
      },
      {
        title: 'Q: What should I do if an agent asks for money before physical viewing?',
        content: [
          'A: DO NOT PAY. Report the agent immediately using the "Report Listing" button or email abuse@dormiqa.ng. Demanding inspection fees prior to viewing violates Dormiqa policy.'
        ]
      },
      {
        title: 'Q: Which universities and campuses does Dormiqa cover?',
        content: [
          'A: Dormiqa covers major federal, state, and private universities, polytechnics, and colleges across Nigeria (including UNILAG, OAU, UI, UNN, ABU, FUTA, UNILORIN, Covenant, LASU) with ongoing expansion across Ghana, Kenya, and South Africa.'
        ]
      }
    ]
  },
  {
    id: 'contact-us',
    category: 'support',
    title: 'Contact Us',
    subtitle: 'Direct channels to reach our customer support, safety, and corporate teams.',
    lastUpdated: 'August 1, 2026',
    iconName: 'Mail',
    sections: [
      {
        title: 'General Support & Inquiries',
        content: [
          'Email: support@dormiqa.ng',
          'Phone / WhatsApp Support: +234 800 DORMIQA (+234 800 367 6472)',
          'Operating Hours: Monday – Saturday, 8:00 AM – 8:00 PM WAT'
        ]
      },
      {
        title: 'Safety, Fraud & Legal Escalations',
        content: [
          'Safety & Fraud Response: abuse@dormiqa.ng | safety@dormiqa.ng',
          'Legal & Compliance: legal@dormiqa.ng',
          'Data Protection Officer: dpo@dormiqa.ng'
        ]
      },
      {
        title: 'Headquarters & Campus Hubs',
        content: [
          'Corporate Office: [COMPANY ADDRESS: Yaba Innovation Hub, Herbert Macaulay Way, Yaba, Lagos State, Nigeria]',
          'Regional Support Desk: Ikeja, Akoka-UNILAG Gate, Ife Campus Hub, Abuja Tech District.'
        ]
      }
    ]
  },
  {
    id: 'report-problem',
    category: 'support',
    title: 'Report a Problem',
    subtitle: 'Report technical bugs, broken features, or account access difficulties.',
    lastUpdated: 'August 1, 2026',
    iconName: 'AlertCircle',
    sections: [
      {
        title: '1. Technical Bug Reports',
        content: [
          'If you experience app crashes, missing search filters, or photo loading issues, please contact tech@dormiqa.ng with your device model and screenshot details.'
        ]
      },
      {
        title: '2. Account Access & Password Reset',
        content: [
          'Having trouble signing in or verifying your email? Use the "Forgot Password" link on the sign-in modal or contact support@dormiqa.ng for fast assistance.'
        ]
      }
    ]
  }
];

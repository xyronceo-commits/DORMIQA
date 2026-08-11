import { InfoDoc } from './legalDocs';

export const SAFETY_DOCS: InfoDoc[] = [
  {
    id: 'community-guidelines',
    category: 'safety',
    title: 'Community Guidelines',
    subtitle: 'Standards for safe, respectful, and constructive interaction on Dormiqa.',
    lastUpdated: 'August 1, 2026',
    iconName: 'Users',
    sections: [
      {
        title: '1. Respect and Inclusivity',
        content: [
          'Dormiqa is built to serve students from all backgrounds, regions, and cultures across Africa. Harassment, hate speech, bullying, or discrimination based on tribe, state of origin, religion, gender, or disability is strictly banned.'
        ]
      },
      {
        title: '2. Professional Agent Conduct',
        content: [
          'Agents must treat students with respect, provide accurate property information, honor inspection appointments, and maintain professional communication.'
        ]
      },
      {
        title: '3. Student Responsibility',
        content: [
          'Students must respect agents’ time by attending scheduled inspections promptly or canceling with advance notice.'
        ]
      }
    ]
  },
  {
    id: 'verification-policy',
    category: 'safety',
    title: 'Agent & Listing Verification Policy',
    subtitle: 'Comprehensive criteria for granting Verified status to agents and properties.',
    lastUpdated: 'August 1, 2026',
    iconName: 'ShieldCheck',
    sections: [
      {
        title: '1. Why Verification Matters',
        content: [
          'Off-campus housing fraud is a major challenge for university students. Dormiqa’s Verification Policy safeguards students by ensuring that agents are real, identity-verified individuals with legitimate access to accommodation.'
        ]
      },
      {
        title: '2. Agent Identity Verification Steps',
        content: [
          'To earn the Verified Agent badge, an agent must submit: (a) Government Photo ID (NIN, Driver’s License, Voters Card, or Passport); (b) Live selfie verification; (c) Business Registration (CAC) if operating as an agency; (d) Active phone number and email address.'
        ]
      },
      {
        title: '3. Property Listing Verification Steps',
        content: [
          'Listings undergo automated and human review. Higher-tier Verified Listings require geotagged photos, proof of management authorization, or physical audit by Dormiqa campus ambassadors.'
        ]
      },
      {
        title: '4. Verification Revocation',
        content: [
          'Verified status is revoked immediately if an agent posts false listings, demands unauthorized upfront fees, or accumulates unresolved student safety complaints.'
        ]
      }
    ]
  },
  {
    id: 'listing-quality',
    category: 'safety',
    title: 'Listing Quality Guidelines',
    subtitle: 'Standards for photo quality, facility tags, distance accuracy, and pricing.',
    lastUpdated: 'August 1, 2026',
    iconName: 'CheckCircle',
    sections: [
      {
        title: '1. Photo Standards',
        content: [
          'Listings must include at least 3 clear, well-lit photos showing the interior room, bathroom/toilet facilities, and external building structure. Heavily edited, watermarked, or stolen stock photos are rejected.'
        ]
      },
      {
        title: '2. Accurate Facility & Utility Tags',
        content: [
          'Agents must accurately tag amenities (e.g., 24/7 Solar Power, Running Water, Security Fence, WiFi). Claiming nonexistent utilities violates platform rules.'
        ]
      },
      {
        title: '3. Honest Distance & Location Claims',
        content: [
          'Distance to campus gates must be stated accurately in walking minutes and kilometers based on real maps, not exaggerated figures.'
        ]
      }
    ]
  },
  {
    id: 'review-policy',
    category: 'safety',
    title: 'Review & Rating Integrity Policy',
    subtitle: 'Ensuring honest, authentic, and manipulation-free feedback from verified students.',
    lastUpdated: 'August 1, 2026',
    iconName: 'Star',
    sections: [
      {
        title: '1. Genuine Student Reviews',
        content: [
          'Reviews on Dormiqa must be posted by verified students who have inspected or resided in the property.'
        ]
      },
      {
        title: '2. Zero Tolerance for Fake Reviews',
        content: [
          'Agents are forbidden from creating fake student accounts to leave positive reviews for their own listings or negative reviews for competitors. Violators face permanent platform bans.'
        ]
      },
      {
        title: '3. Moderation & Removal Criteria',
        content: [
          'Dormiqa removes reviews that contain profanity, personal address leaks, extortion threats, or irrelevant marketing spam.'
        ]
      }
    ]
  },
  {
    id: 'anti-fraud',
    category: 'safety',
    title: 'Anti-Fraud & Scam Prevention Policy',
    subtitle: 'Zero-tolerance rules against advance fee fraud, fake listings, and impersonation.',
    lastUpdated: 'August 1, 2026',
    iconName: 'ShieldAlert',
    sections: [
      {
        title: '1. Zero Tolerance for Rental Fraud',
        content: [
          'Dormiqa enforces a strict zero-tolerance policy regarding rental scams, advance-fee fraud, fake photo upload, and agent identity theft.'
        ]
      },
      {
        title: '2. Red Flags & Warning Indicators',
        content: [
          'Students should watch out for: (a) Agents demanding money before physical inspection; (b) Prices significantly below market rate for hot campus locations; (c) Refusal to meet in person at the property.'
        ]
      },
      {
        title: '3. Reporting Scammers & Law Enforcement Cooperation',
        content: [
          'When fraud is detected, Dormiqa freezes the implicated account, preserves server logs and government ID records, and cooperates fully with police and anti-fraud law enforcement agencies.'
        ]
      }
    ]
  },
  {
    id: 'report-abuse',
    category: 'safety',
    title: 'Report Abuse & Violations Policy',
    subtitle: 'How to flag unsafe listings, suspicious behavior, or policy breaches.',
    lastUpdated: 'August 1, 2026',
    iconName: 'Flag',
    sections: [
      {
        title: '1. In-App Flagging System',
        content: [
          'Every property listing and user profile features a "Report Listing" button allowing students to flag suspicious content directly to our safety operations team.'
        ]
      },
      {
        title: '2. Review Timelines',
        content: [
          'Safety reports involving potential financial fraud or student physical safety are triaged within two (2) hours. General listing policy flags are reviewed within 24 hours.'
        ]
      },
      {
        title: '3. Whistleblower Protection',
        content: [
          'All reports are kept confidential. Agents are never informed of the identity of the user who submitted a report.'
        ]
      }
    ]
  }
];

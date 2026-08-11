export interface InfoSection {
  title: string;
  content: string[];
}

export interface InfoDoc {
  id: string;
  category: 'legal' | 'safety' | 'support' | 'company';
  title: string;
  subtitle: string;
  lastUpdated: string;
  iconName: string;
  sections: InfoSection[];
}

export const LEGAL_DOCS: InfoDoc[] = [
  {
    id: 'terms-and-conditions',
    category: 'legal',
    title: 'Terms & Conditions',
    subtitle: 'General Master Terms of Service governing the use of the Dormiqa platform.',
    lastUpdated: 'August 1, 2026',
    iconName: 'FileText',
    sections: [
      {
        title: '1. Introduction & Agreement to Terms',
        content: [
          'Welcome to Dormiqa ("Platform", "we", "us", or "our"). These Master Terms & Conditions govern your access to and use of our mobile applications, web applications, APIs, and associated online services.',
          'By creating an account, browsing listings, or using any feature on Dormiqa, you enter into a legally binding agreement with Dormiqa Technologies Limited ([COMPANY REGISTRATION NUMBER (RC/CAC)]). If you do not agree to these terms, you must discontinue platform access immediately.',
          'Dormiqa is designed primarily for higher-education students, property agents, and landlords across Nigeria and expanded African markets.'
        ]
      },
      {
        title: '2. Nature of Platform & Zero Payment Hosting',
        content: [
          'CRITICAL NOTICE: Dormiqa operates strictly as an online technology platform connecting students seeking off-campus accommodation with independent verified property agents and landlords.',
          'Dormiqa IS NOT a real estate brokerage, property management company, landlord, tenancy agent, or escrow provider. We do not own, manage, inspect, lease, or guarantee any properties published on the platform.',
          'Dormiqa DOES NOT process, collect, hold, or escrow tenancy rental fees, caution fees, or legal documentation payments. All rental transactions, tenancy agreements, and physical property inspections take place directly and independently between the student and the verified agent.'
        ]
      },
      {
        title: '3. Account Eligibility & Registration',
        content: [
          'To register a Student account, you must be at least 16 years of age or possess legal authorization to pursue tertiary education.',
          'To register an Agent account, you must be at least 18 years of age, provide valid government-issued identification (NIN, Driver’s License, Voters Card, or International Passport), and submit verifiable documentation establishing authorization to market the listed property.',
          'You are solely responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account.'
        ]
      },
      {
        title: '4. Physical Inspection Requirement & Safety Mandate',
        content: [
          'We strongly advise all students NEVER to transfer funds or sign tenancy contracts prior to conducting a physical inspection of the property alongside a verified agent.',
          'While Dormiqa enforces strict agent verification protocols, we cannot independently warrant the live structural integrity, utility uptime (water/electricity), or personal safety of any listed property.'
        ]
      },
      {
        title: '5. Prohibited Activities',
        content: [
          'Users are strictly prohibited from: (a) Posting fraudulent, duplicate, or misleading property listings; (b) Impersonating university officials or accredited agents; (c) Demanding advance inspection fees prior to physical viewing; (d) Scraping platform data using automated bots; (e) Engaging in harassment, hate speech, or discriminatory housing practices.'
        ]
      },
      {
        title: '6. Limitation of Liability',
        content: [
          'To the maximum extent permitted under applicable law, Dormiqa Technologies Limited, its directors, employees, and affiliates shall not be liable for any direct, indirect, incidental, or consequential damages resulting from off-platform transactions, property defects, misrepresentations by agents, or monetary loss incurred during tenancy negotiations.',
          'Our total cumulative liability for any claim arising from platform usage shall not exceed the subscription fees paid by you to Dormiqa in the preceding three (3) months.'
        ]
      },
      {
        title: '7. Account Termination & Suspension',
        content: [
          'We reserve the right to suspend or permanently delete any account that violates these Terms, receives validated fraud reports, or fails agent identity verification checks, without prior notice or refund of subscription credits.'
        ]
      },
      {
        title: '8. Dispute Resolution & Governing Law',
        content: [
          'These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria [GOVERNING LAW].',
          'Any dispute arising from or in connection with these Terms shall first be submitted to informal mediation with Dormiqa Support. If unresolved within thirty (30) days, the dispute shall be referred to binding arbitration under the Arbitration and Mediation Act of Nigeria, conducted in Lagos State [JURISDICTION CITY].'
        ]
      },
      {
        title: '9. Business Contact Information',
        content: [
          'Dormiqa Technologies Limited',
          'Registration: [COMPANY REGISTRATION NUMBER (RC/CAC)]',
          'Corporate Address: [COMPANY ADDRESS: e.g. Yaba Innovation Hub, Herbert Macaulay Way, Yaba, Lagos, Nigeria]',
          'Official Contact Email: legal@dormiqa.ng | support@dormiqa.ng'
        ]
      }
    ]
  },
  {
    id: 'privacy-policy',
    category: 'legal',
    title: 'Privacy Policy',
    subtitle: 'How we collect, store, process, and safeguard your personal data.',
    lastUpdated: 'August 1, 2026',
    iconName: 'Shield',
    sections: [
      {
        title: '1. Data Protection Commitment & NDPA Compliance',
        content: [
          'Dormiqa is committed to safeguarding the privacy and personal data of our users in compliance with the Nigeria Data Protection Act 2023 (NDPA) and applicable African data protection frameworks.',
          'This Privacy Policy explains the data we collect, why we collect it, how it is secured, and your legal rights regarding your information.'
        ]
      },
      {
        title: '2. Information We Collect',
        content: [
          'a. Personal Identification Data: Name, email address, phone number, university affiliation, department, and profile picture.',
          'b. Agent Verification Data: National Identification Number (NIN), Government ID uploads, business registration certificates (CAC), utility bills, and proof of property ownership/mandate.',
          'c. Usage & Device Information: IP address, device type, browser specifications, operating system, and search preferences.',
          'd. Communication Logs: In-app messaging logs between students and agents to monitor trust and safety compliance.'
        ]
      },
      {
        title: '3. How We Use Your Data',
        content: [
          'We use collected data exclusively to: (i) Verify agent identity and authenticity of listings; (ii) Facilitate inspection scheduling between students and agents; (iii) Personalize campus housing search results; (iv) Detect and prevent fraudulent activities; (v) Send system alerts and service notifications.'
        ]
      },
      {
        title: '4. Legal Bases for Processing',
        content: [
          'We process your data under legitimate interest (platform security and fraud prevention), contractual performance (providing housing connection services), and user consent (marketing communications and location services).'
        ]
      },
      {
        title: '5. Data Sharing & Third Parties',
        content: [
          'Dormiqa DOES NOT sell user personal data to third-party advertisers.',
          'We share data only with verified cloud infrastructure providers (e.g., Google Cloud Platform, Firebase) operating under strict encryption and privacy standards, or when required by law enforcement under a valid court order.'
        ]
      },
      {
        title: '6. Data Retention & Deletion Rights',
        content: [
          'We retain active account data as long as your account remains open. You may request account deletion at any time via your profile settings or by emailing dpo@dormiqa.ng. Deleted account data is scrubbed within 30 days, except where legal retention obligations apply.'
        ]
      },
      {
        title: '7. Data Protection Officer Contact',
        content: [
          'Data Protection Officer Email: dpo@dormiqa.ng',
          'Physical Address: [COMPANY ADDRESS: Yaba Innovation Hub, Lagos, Nigeria]'
        ]
      }
    ]
  },
  {
    id: 'cookie-policy',
    category: 'legal',
    title: 'Cookie Policy',
    subtitle: 'Clear explanations of web cookies, session storage, and user choices.',
    lastUpdated: 'August 1, 2026',
    iconName: 'Cookie',
    sections: [
      {
        title: '1. What Are Cookies and Local Storage',
        content: [
          'Cookies and browser local storage are small text files placed on your device to remember user preferences, maintain session state, and analyze platform performance.'
        ]
      },
      {
        title: '2. Types of Cookies We Use',
        content: [
          'a. Essential Cookies: Required for secure authentication, account login state, and CSRF protection.',
          'b. Preference Cookies: Store your preferred university campus, state filters, and light/dark theme choices.',
          'c. Analytics Cookies: Help us measure platform usage patterns, search performance, and page loading speeds.'
        ]
      },
      {
        title: '3. Managing Cookie Preferences',
        content: [
          'You can modify browser settings to block or delete cookies. Note that disabling essential cookies will prevent successful sign-in and search saved state.'
        ]
      }
    ]
  },
  {
    id: 'acceptable-use',
    category: 'legal',
    title: 'Acceptable Use Policy',
    subtitle: 'Rules for acceptable and prohibited behavior on the Dormiqa platform.',
    lastUpdated: 'August 1, 2026',
    iconName: 'AlertOctagon',
    sections: [
      {
        title: '1. Core Objective',
        content: [
          'This Acceptable Use Policy ensures that Dormiqa remains a safe, respectful, and reliable environment for students, landlords, and housing agents.'
        ]
      },
      {
        title: '2. Prohibited Conduct',
        content: [
          'You agree NOT to use Dormiqa to: (a) Publish fake accommodation photos or misleading pricing; (b) Demand non-refundable inspection booking fees; (c) Post discriminatory requirements regarding ethnic group, religion, or gender (except designated male-only or female-only student hostels); (d) Solicit or distribute unlawful materials or spam; (e) Attempt unauthorized access to admin systems.'
        ]
      },
      {
        title: '3. Penalties & Legal Reporting',
        content: [
          'Violations lead to immediate account ban, listing removal, and, in cases of monetary fraud or extortion, referral to law enforcement agencies including the EFCC and Nigeria Police Force.'
        ]
      }
    ]
  },
  {
    id: 'agent-terms',
    category: 'legal',
    title: 'Agent Terms & Service Agreement',
    subtitle: 'Obligations, verification rules, and service agreements for agents and landlords.',
    lastUpdated: 'August 1, 2026',
    iconName: 'Briefcase',
    sections: [
      {
        title: '1. Verification & Identity Mandate',
        content: [
          'All agents and landlords listing accommodation on Dormiqa must complete identity verification by submitting valid government photo ID, business details (where applicable), and proof of authorization to represent the property.'
        ]
      },
      {
        title: '2. Listing Accuracy & Pricing Integrity',
        content: [
          'Agents guarantee that: (a) Listed rental prices match real current rates with no hidden surcharge; (b) Photos accurately represent the live state of the accommodation; (c) Availability status (vacant or occupied) is updated within 24 hours of tenancy signature.'
        ]
      },
      {
        title: '3. Professional Inspection Code',
        content: [
          'Agents agree to meet students punctually for physical inspections, behave respectfully, and refrain from demanding compulsory upfront viewing fees before physical property showing.'
        ]
      },
      {
        title: '4. Subscription Fees & Platform Usage',
        content: [
          'Agent subscription fees grant access to publish listings and receive student inspection bookings. Fees are non-refundable once listing credits are activated.'
        ]
      }
    ]
  },
  {
    id: 'student-terms',
    category: 'legal',
    title: 'Student Terms & Code of Conduct',
    subtitle: 'Safety protocols, inspection guidelines, and terms for student users.',
    lastUpdated: 'August 1, 2026',
    iconName: 'GraduationCap',
    sections: [
      {
        title: '1. Account Ownership & Student Authenticity',
        content: [
          'Students must provide accurate contact information and university affiliation to facilitate seamless inspection scheduling.'
        ]
      },
      {
        title: '2. Physical Inspection Safety Rules',
        content: [
          'Students are advised to: (a) Attend property inspections during daylight hours; (b) Inform a peer or relative of the inspection location; (c) Inspect water running, electricity meters, and room locks before signing tenancy agreements.'
        ]
      },
      {
        title: '3. Honest Reviews & Feedback',
        content: [
          'Reviews posted for hostels or agents must reflect truthful, firsthand experiences. Libelous, abusive, or fake reviews are prohibited.'
        ]
      }
    ]
  },
  {
    id: 'disclaimer',
    category: 'legal',
    title: 'Disclaimer & Limitation of Liability',
    subtitle: 'Clarification of platform role, non-party status, and legal liability limits.',
    lastUpdated: 'August 1, 2026',
    iconName: 'AlertTriangle',
    sections: [
      {
        title: '1. Technology Platform Disclaimer',
        content: [
          'Dormiqa is a digital matching utility. We do not act as property managers, estate agents, or legal representatives for any party.'
        ]
      },
      {
        title: '2. No Guarantee of Tenancy Outcomes',
        content: [
          'We do not guarantee that browsing Dormiqa will secure accommodation, nor do we guarantee to agents that publishing listings will secure tenants.'
        ]
      },
      {
        title: '3. Off-Platform Financial Risk Disclaimer',
        content: [
          'Dormiqa assumes ZERO financial responsibility for money transferred directly between students and agents off the platform.'
        ]
      }
    ]
  },
  {
    id: 'intellectual-property',
    category: 'legal',
    title: 'Intellectual Property Policy',
    subtitle: 'Ownership rules regarding trademarks, software, and user content.',
    lastUpdated: 'August 1, 2026',
    iconName: 'Award',
    sections: [
      {
        title: '1. Dormiqa IP Rights',
        content: [
          'All platform branding, logos, software source code, UI designs, and database aggregations are the exclusive property of Dormiqa Technologies Limited.'
        ]
      },
      {
        title: '2. User Content License',
        content: [
          'By uploading photos or descriptions to Dormiqa, agents grant us a non-exclusive, royalty-free license to display and market those property assets across our digital channels.'
        ]
      }
    ]
  },
  {
    id: 'copyright-policy',
    category: 'legal',
    title: 'Copyright & DMCA Takedown Policy',
    subtitle: 'Procedures for reporting and resolving copyright infringement claims.',
    lastUpdated: 'August 1, 2026',
    iconName: 'Lock',
    sections: [
      {
        title: '1. Reporting Infringement',
        content: [
          'If you believe a listing photo or description infringes upon your copyright, submit a written takedown notice to copyright@dormiqa.ng with proof of ownership.'
        ]
      },
      {
        title: '2. Action & Takedown Protocol',
        content: [
          'Upon receiving a valid notice, Dormiqa will remove the infringing content within 48 hours and notify the posting agent.'
        ]
      }
    ]
  }
];

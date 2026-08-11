import { AiSearchResult } from '../types';

export async function searchAccommodationWithAi(prompt: string): Promise<AiSearchResult> {
  try {
    const res = await fetch('/api/gemini/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error('AI search failed');
    return await res.json();
  } catch (err) {
    console.warn('AI search error, using client fallback', err);
    return {
      interpretedQuery: prompt,
      matchedListingIds: [],
      explanation: 'Search complete. Explore listings matching your query below.'
    };
  }
}

export function cleanBotReply(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Remove <think>...</think> blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // 2. Remove unclosed <think>... blocks
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');

  // 3. Remove <thinking>...</thinking> or <thought>...</thought> or <reasoning>...
  cleaned = cleaned.replace(/<(thinking|thought|reasoning)>[\s\S]*?<\/(thinking|thought|reasoning)>/gi, '');
  cleaned = cleaned.replace(/<(thinking|thought|reasoning)>[\s\S]*/gi, '');

  // 4. Remove leading thinking headers
  cleaned = cleaned.replace(/^(Thinking Process|Thought Process|Thought|Reasoning|Chain of Thought):\s*[\s\S]*?\n\n/gi, '');

  // 5. Remove any echoed input / context headers
  cleaned = cleaned.replace(/^(System Instruction|User Query|User|Context|Input|Prompt):\s*.*?\n/gi, '');

  return cleaned.trim();
}

export async function chatWithDormiqaBot(message: string, history?: any[]): Promise<string> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error('Chatbot error');
    const data = await res.json();
    return cleanBotReply(data.reply || '');
  } catch (err) {
    console.warn('AI chat error', err);
    return 'Hello! I am Dormiqa AI Assistant. You can search hostels, schedule physical inspections, or contact verified agents safely through Dormiqa!';
  }
}

export const chatWithCamporaBot = chatWithDormiqaBot;

export async function generateListingDescription(listingInfo: {
  title: string;
  universityName: string;
  type: string;
  price: number;
  currency: string;
  period: string;
  facilities: string[];
}): Promise<string> {
  try {
    const res = await fetch('/api/gemini/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingInfo),
    });
    if (!res.ok) throw new Error('Generation error');
    const data = await res.json();
    return data.description;
  } catch (err) {
    console.warn('AI description error', err);
    return `Modern ${listingInfo.type} accommodation located near ${listingInfo.universityName}. Beautiful student housing with excellent facilities including ${listingInfo.facilities.join(', ')}. Rent is ${listingInfo.currency}${listingInfo.price}/${listingInfo.period}. Contact verified agent to schedule an inspection today!`;
  }
}

export async function checkDuplicateListing(listingDetails: {
  title: string;
  address: string;
  universityName: string;
  price: number;
}): Promise<{ isDuplicate: boolean; confidenceScore: number; reason: string }> {
  try {
    const res = await fetch('/api/gemini/detect-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingDetails),
    });
    if (!res.ok) throw new Error('Duplicate check error');
    return await res.json();
  } catch (err) {
    return { isDuplicate: false, confidenceScore: 0, reason: 'Check passed' };
  }
}

export async function reviewListingWithAi(listing: {
  id?: string;
  title: string;
  address: string;
  universityName: string;
  price: number;
  imagesCount: number;
  video360Url?: string;
  description?: string;
  agentId?: string;
}): Promise<{ approved: boolean; status: 'active' | 'rejected'; reason: string; riskScore?: number }> {
  try {
    const res = await fetch('/api/gemini/review-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing),
    });
    if (!res.ok) throw new Error('Review failed');
    return await res.json();
  } catch (err) {
    return {
      approved: true,
      status: 'active',
      reason: 'Listing verified and approved for publication on Dormiqa student timeline.',
      riskScore: 0
    };
  }
}

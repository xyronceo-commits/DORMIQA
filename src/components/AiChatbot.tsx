import React, { useState, useRef, useEffect } from 'react';
import { chatWithDormiqaBot } from '../lib/gemini';
import { 
  Bot, Sparkles, X, Send, User, ChevronDown, ShieldCheck, HelpCircle, 
  Code, Copy, Check, Terminal, CheckCircle2, Info, List, FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

// Inline Formatter for **bold**, *italics*, and `inline code`
const FormatInlineText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g);

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
              {part.slice(1, -1)}
            </code>
          );
        }
        if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
          return <strong key={idx} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
          return <em key={idx} className="italic text-slate-800 dark:text-slate-200">{part.slice(1, -1)}</em>;
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
};

// Code Block Component with Copy feature & Dark Theme
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'code' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-sm text-left">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="uppercase font-bold tracking-wider">{language || 'CODE'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Component to render chat text and automatically convert Markdown, Code, Tables, Lists into clean UI components
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {

  const parseHtmlTableString = (htmlText: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const tableEl = doc.querySelector('table');
      if (!tableEl) return null;

      const headers: string[] = [];
      const rows: string[][] = [];

      tableEl.querySelectorAll('th').forEach(th => headers.push(th.textContent?.trim() || ''));
      tableEl.querySelectorAll('tr').forEach(tr => {
        const rowCells: string[] = [];
        const tds = tr.querySelectorAll('td');
        if (tds.length > 0) {
          tds.forEach(td => rowCells.push(td.textContent?.trim() || ''));
          rows.push(rowCells);
        }
      });

      if (headers.length === 0 && rows.length > 0) {
        const firstRow = rows.shift();
        if (firstRow) headers.push(...firstRow);
      }

      return { headers, rows };
    } catch {
      return null;
    }
  };

  // Step 1: Parse code blocks
  const parseCodeBlocks = (input: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
    const segments: { type: 'code' | 'text'; language?: string; content: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(input)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: input.slice(lastIndex, match.index) });
      }
      segments.push({
        type: 'code',
        language: match[1] || 'code',
        content: match[2].trim()
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < input.length) {
      segments.push({ type: 'text', content: input.slice(lastIndex) });
    }

    return segments;
  };

  // Step 2: Parse text segment into lines (headings, lists, blockquotes, tables, paragraphs)
  const parseTextSegment = (inputText: string) => {
    // Check if HTML table exists
    if (inputText.includes('<table') && inputText.includes('</table>')) {
      const parts = inputText.split(/(<table[\s\S]*?<\/table>)/i);
      return parts.map((part) => {
        if (part.toLowerCase().includes('<table')) {
          const parsed = parseHtmlTableString(part);
          if (parsed && (parsed.headers.length > 0 || parsed.rows.length > 0)) {
            return { type: 'parsedTable' as const, content: parsed };
          }
        }
        return { type: 'lines' as const, content: part };
      });
    }

    return [{ type: 'lines' as const, content: inputText }];
  };

  const renderLinesBlock = (rawLinesText: string, keyPrefix: string) => {
    const lines = rawLinesText.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: { isNumbered: boolean; items: string[] } | null = null;
    let currentTableLines: string[] = [];

    const flushList = (key: string) => {
      if (currentList && currentList.items.length > 0) {
        const isNum = currentList.isNumbered;
        elements.push(
          <ul key={key} className="my-2 space-y-1.5 pl-1">
            {currentList.items.map((item, iIdx) => (
              <li key={iIdx} className="flex items-start gap-2 text-xs leading-relaxed">
                {isNum ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {iIdx + 1}
                  </span>
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                <span><FormatInlineText text={item} /></span>
              </li>
            ))}
          </ul>
        );
        currentList = null;
      }
    };

    const flushTable = (key: string) => {
      if (currentTableLines.length > 0) {
        const tableRows = currentTableLines
          .map(l => l.trim())
          .filter(l => l.includes('|'))
          .map(l => {
            let rowStr = l;
            if (rowStr.startsWith('|')) rowStr = rowStr.slice(1);
            if (rowStr.endsWith('|')) rowStr = rowStr.slice(0, -1);
            return rowStr.split('|').map(c => c.trim());
          })
          .filter(row => !row.every(c => /^[-:\s]+$/.test(c)));

        if (tableRows.length > 0) {
          const headers = tableRows[0];
          const rows = tableRows.slice(1);
          elements.push(
            <div key={key} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-sm p-0.5">
              <table className="w-full text-left text-[11px] border-collapse min-w-[260px]">
                {headers.length > 0 && (
                  <thead>
                    <tr className="bg-emerald-100/70 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-emerald-950 dark:text-emerald-300">
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3 py-2 font-bold tracking-wide">
                          <FormatInlineText text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                  {rows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      className={rIdx % 2 === 0 ? 'bg-white dark:bg-slate-900/60' : 'bg-slate-50/60 dark:bg-slate-800/40'}
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 leading-tight">
                          <FormatInlineText text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        currentTableLines = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const lineKey = `${keyPrefix}_${idx}`;

      // Check table row
      if (trimmed.includes('|') && (trimmed.startsWith('|') || trimmed.endsWith('|'))) {
        flushList(`${lineKey}_fl`);
        currentTableLines.push(trimmed);
        return;
      } else {
        flushTable(`${lineKey}_ft`);
      }

      // Headings (#, ##, ###)
      if (trimmed.startsWith('#')) {
        flushList(`${lineKey}_fl`);
        const headingText = trimmed.replace(/^#+\s*/, '');
        elements.push(
          <h4 key={lineKey} className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-2 mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">
            <FormatInlineText text={headingText} />
          </h4>
        );
        return;
      }

      // Blockquotes / Callout (> )
      if (trimmed.startsWith('>')) {
        flushList(`${lineKey}_fl`);
        const quoteText = trimmed.replace(/^>\s*/, '');
        elements.push(
          <div key={lineKey} className="my-2 p-2.5 rounded-r-xl border-l-4 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed"><FormatInlineText text={quoteText} /></div>
          </div>
        );
        return;
      }

      // Bulleted List (- or *)
      const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);
      if (bulletMatch) {
        if (!currentList || currentList.isNumbered) {
          flushList(`${lineKey}_fl`);
          currentList = { isNumbered: false, items: [] };
        }
        currentList.items.push(bulletMatch[1]);
        return;
      }

      // Numbered List (1. or 1))
      const numberedMatch = trimmed.match(/^\d+[\.\)]\s+(.*)/);
      if (numberedMatch) {
        if (!currentList || !currentList.isNumbered) {
          flushList(`${lineKey}_fl`);
          currentList = { isNumbered: true, items: [] };
        }
        currentList.items.push(numberedMatch[1]);
        return;
      }

      // Regular paragraph
      flushList(`${lineKey}_fl`);
      if (trimmed) {
        elements.push(
          <p key={lineKey} className="leading-relaxed">
            <FormatInlineText text={trimmed} />
          </p>
        );
      }
    });

    flushList(`${keyPrefix}_final_fl`);
    flushTable(`${keyPrefix}_final_ft`);

    return elements;
  };

  const segments = parseCodeBlocks(text);

  return (
    <div className="space-y-1.5 text-left">
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return <CodeBlock key={idx} code={seg.content} language={seg.language} />;
        }

        const subBlocks = parseTextSegment(seg.content);
        return (
          <React.Fragment key={idx}>
            {subBlocks.map((sb, sbIdx) => {
              if (sb.type === 'parsedTable') {
                const { headers, rows } = sb.content;
                return (
                  <div key={sbIdx} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-sm p-0.5">
                    <table className="w-full text-left text-[11px] border-collapse min-w-[260px]">
                      {headers.length > 0 && (
                        <thead>
                          <tr className="bg-emerald-100/70 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-emerald-950 dark:text-emerald-300">
                            {headers.map((h, hIdx) => (
                              <th key={hIdx} className="px-3 py-2 font-bold tracking-wide">
                                <FormatInlineText text={h} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                        {rows.map((row, rIdx) => (
                          <tr 
                            key={rIdx} 
                            className={rIdx % 2 === 0 ? 'bg-white dark:bg-slate-900/60' : 'bg-slate-50/60 dark:bg-slate-800/40'}
                          >
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-3 py-2 leading-tight">
                                <FormatInlineText text={cell} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              return renderLinesBlock(sb.content as string, `seg_${idx}_sb_${sbIdx}`);
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const AiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'bot',
      text: "👋 Hi! I'm Dormiqa AI Assistant. I can help you search verified hostels, guide you on campus safety, or give tips on inspecting student apartments. How can I help today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const reply = await chatWithDormiqaBot(query, history);

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: 'Sorry, I ran into an error connecting to Dormiqa AI. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Safety checklist for hostel inspection?",
    "How does Dormiqa verify agents?",
    "Questions to ask landlord before moving in?"
  ];

  return (
    <>
      {/* Floating Widget Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[70] p-4 rounded-full bg-slate-900 dark:bg-emerald-600 text-white shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 group border border-slate-700/50"
          title="Dormiqa AI Assistant"
        >
          <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-xs pr-1 hidden sm:inline">Ask Dormiqa AI</span>
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[75] w-[92vw] sm:w-[380px] h-[520px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    Dormiqa Assistant
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                      Smart AI
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Always online to help students
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <FormattedMessage text={msg.text} />
                    <span
                      className={`block text-[9px] mt-1 ${
                        msg.sender === 'user' ? 'text-emerald-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-tl-none flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="p-2 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0 transition-colors"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about accommodation, safety, or rules..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

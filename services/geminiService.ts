import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Article, ChatMessage, ArticleCategory, SearchFilters } from "../types";
import { getUniqueCategoryImages, SYSTEM_INSTRUCTION } from "../constants";

// --- RICH FALLBACK DATA (Offline/Demo Mode) ---
const FALLBACK_ARTICLES: Article[] = [
  {
    id: 'fb-1',
    title: 'The Rise of Agentic AI: Beyond LLMs',
    source: 'Google DeepMind',
    publishedAt: new Date().toISOString(),
    category: ArticleCategory.AI,
    url: 'https://deepmind.google/discover/blog/agentic-ai',
    summary: 'A shift from passive chatbots to active agents that can execute complex workflows autonomously is transforming the enterprise landscape.',
    content: 'The next generation of AI models moves beyond simple text generation to executing multi-step tasks. These "Agentic" systems can plan, reason, and interact with external tools to solve complex problems in software engineering and data analysis.',
    keyTakeaways: ['Shift from chat to action', 'Autonomous workflow execution', 'Enterprise adoption accelerating'],
  	 whyItMatters: 'Agents will automate entire job functions, not just tasks.',
  	 imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
  	 images: []
  },
  {
  	 id: 'fb-2',
  	 title: 'Breakthrough in Silicon-Based Quantum Computing',
  	 source: 'Nature Physics',
  	 publishedAt: new Date(Date.now() - 86400000).toISOString(),
  	 category: ArticleCategory.QUANTUM,
  	 url: 'https://nature.com',
  	 summary: 'Researchers demonstrate high-fidelity qubit control in standard silicon, paving the way for scalable quantum processors using existing fab techniques.',
  	 content: 'By utilizing electron spins in silicon quantum dots, scientists achieved 99% fidelity. This compatibility with CMOS manufacturing could drastically reduce the cost and complexity of building quantum computers compared to superconducting circuits.',
  	 keyTakeaways: ['99% Qubit Fidelity', 'CMOS Compatible', 'Scalability path clear'],
  	 whyItMatters: 'Moves quantum computing from the lab to potentially mass-producible chips.',
  	 imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
  	 images: []
  },
  {
  	 id: 'fb-3',
  	 title: 'SpaceX Starship: The Path to Mars Colonization',
  	 source: 'SpaceNews',
  	 publishedAt: new Date(Date.now() - 172800000).toISOString(),
  	 category: ArticleCategory.SPACE,
  	 url: 'https://spacenews.com',
  	 summary: 'Recent successful static fire tests suggest the next orbital flight attempt is imminent, with crucial heat shield upgrades.',
  	 content: 'The Starship program represents the largest flying object ever built. Success in the upcoming orbital test is critical for the Artemis moon missions and future Mars architecture. Key upgrades to the launch tower and thermal protection tiles are being tested.',
  	 keyTakeaways: ['Largest rocket ever', 'Critical for Artemis', 'Rapid iteration speed'],
  	 whyItMatters: 'Reduces cost-to-orbit by 100x, enabling true space economy.',
  	 imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
  	 images: []
  },
  {
  	 id: 'fb-4',
  	 title: 'Post-Quantum Cryptography Standards Finalized',
  	 source: 'NIST',
  	 publishedAt: new Date(Date.now() - 200000000).toISOString(),
  	 category: ArticleCategory.CYBERSECURITY,
  	 url: 'https://nist.gov',
  	 summary: 'NIST releases the first three finalized standards for encryption algorithms designed to withstand quantum computer attacks.',
  	 content: 'As quantum computers advance, current RSA encryption becomes vulnerable. These new lattice-based cryptographic standards (FIPS 203, 204, 205) are now recommended for immediate adoption by federal agencies and tech giants to secure data for the future.',
  	 keyTakeaways: ['FIPS 203/204/205 released', 'RSA replacement', 'Immediate adoption urged'],
  	 whyItMatters: 'Protects global financial and private data from "harvest now, decrypt later" attacks.',
  	 imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
  	 images: []
  },
  {
  	 id: 'fb-5',
  	 title: 'Solid State Batteries Hit Energy Density Milestone',
  	 source: 'IEEE Spectrum',
  	 publishedAt: new Date(Date.now() - 300000000).toISOString(),
  	 category: ArticleCategory.CLEANTECH,
  	 url: 'https://spectrum.ieee.org',
  	 summary: 'New electrolyte material allows solid-state batteries to exceed 900 Wh/L, promising 700+ mile range EVs.',
  	 content: 'New electrolyte material allows solid-state batteries to exceed 900 Wh/L, promising 700+ mile range EVs.',
  	 keyTakeaways: ['900 Wh/L Density', 'Safety improved', 'Lithium Metal Anode'],
  	 whyItMatters: 'Could eliminate range anxiety and make electric aviation viable.',
  	 imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
  	 images: []
  }
];

// Helper to get client instance with latest key
const getAIClient = () => {
  // CLOUD RUN & DEPLOYMENT SUPPORT:
  // We check ALL standard injection patterns to ensure the key is found.
  
  // 1. Process Env (Standard Node/Build) - Checks for API_KEY (your request) or REACT_APP_API_KEY (common in React)
  let key = process.env.API_KEY || process.env.REACT_APP_API_KEY || process.env.VITE_API_KEY;
  
  // 2. Window/Runtime Injection (Docker/Cloud Run entrypoints)
  // This allows variables injected at runtime to override build-time vars
  if (typeof window !== 'undefined') {
  	 const win = window as any;
  	 // -----------------------------------------------------------------------
  	 // FIX APPLIED HERE: Added check for win.ENV?.GEMINI_API_KEY
  	 // This matches the key name injected by your docker-entrypoint.sh script.
  	 // -----------------------------------------------------------------------
  	 const runtimeKey = win.ENV?.GEMINI_API_KEY || win.ENV?.API_KEY || win.ENV?.REACT_APP_API_KEY || win.REACT_APP_API_KEY;
  	 if (runtimeKey) key = runtimeKey;
  }
  
  // 3. Vite Specific (if import.meta is available)
  if (!key && (import.meta as any).env) {
  	 key = (import.meta as any).env.API_KEY || (import.meta as any).env.VITE_API_KEY;
  }

  if (!key || key === "YOUR_RUNTIME_GEMINI_KEY_PLACEHOLDER") {
  	 if (!(window as any)._hasWarnedKey) {
  	 	 console.error("CRITICAL: No API Key found or placeholder still present.");
  	 	 console.log("Please ensure 'GEMINI_API_KEY' is set in your Cloud Run Variables & Secrets.");
  	 	 (window as any)._hasWarnedKey = true;
  	 }
  	 return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Real-time Backend Service
 * Fetches latest news using Gemini 2.5 Flash + Google Search Tool.
 */
export const fetchLiveNews = async (category: string, page: number = 1, filters?: SearchFilters): Promise<Article[]> => {
  const ai = getAIClient();

  // --- FALLBACK MODE ACTIVATION ---
  if (!ai) {
  	 console.warn("Using offline fallback data due to missing API Key.");
  	 const images = getUniqueCategoryImages(category, FALLBACK_ARTICLES.length);
  	 return FALLBACK_ARTICLES.map((a, i) => ({
  	 	 ...a,
  	 	 imageUrl: images[i % images.length],
  	 	 images: getUniqueCategoryImages(category, 3)
  	 }));
  }
  // --------------------------------

  const categoryTerm = category === ArticleCategory.ALL ? "latest emerging technology and engineering news" : category;
  
  let filterInstructions = "";
  if (filters) {
  	 if (filters.dateRange === 'today') {
  	 	 filterInstructions += "STRICT REQUIREMENT: Only include content published within the last 24 hours.\n";
  	 } else if (filters.dateRange === 'week') {
  	 	 filterInstructions += "STRICT REQUIREMENT: Only include content published within the last 7 days.\n";
  	 } else if (filters.dateRange === 'month') {
  	 	 filterInstructions += "Requirement: Only include content published within the last 30 days.\n";
  	 }

  	 if (filters.source !== 'all') {
  	 	 filterInstructions += `STRICT REQUIREMENT: Prioritize and filter for content from the source "${filters.source}" if available.\n`;
  	 }
  }

  const prompt = `
  	 You are a real-time content aggregator.
  	 Topic: "${categoryTerm}".
  	 ${filterInstructions}
  	 
  	 Task:
  	 1. Use 'googleSearch' to find 6 DISTINCT, RECENT, high-quality technical articles.
  	 2. Focus on: Systems Engineering, AI, Hardware, Cloud, and Future Tech.
  	 3. Return a valid JSON Array.

  	 CRITICAL OUTPUT RULE:
  	 - Output ONLY the raw JSON array.
  	 - Do NOT wrap in markdown code blocks (no \`\`\`json).
  	 - Do NOT add preamble text like "Here are the articles".
  	 - START the response with '[' and END with ']'.

  	 JSON Structure per item:
  	 {
  	 	 "title": "String",
  	 	 "source": "String",
  	 	 "publishedAt": "String (e.g. '2 hours ago' or ISO date)",
  	 	 "summary": "String (2 sentences max)",
  	 	 "keyTakeaways": ["String", "String", "String"],
  	 	 "whyItMatters": "String",
  	 	 "content": "String (Full paragraph, 4-5 sentences)"
  	 }
  `;

  try {
  	 const response = await ai.models.generateContent({
  	 	 model: "gemini-2.5-flash",
  	 	 contents: prompt,
  	 	 config: {
  	 	 	 temperature: 0.1,
  	 	 	 tools: [{ googleSearch: {} }],
  	 	 	 // CRITICAL FIX: responseMimeType: "application/json" REMOVED.
  	 	 	 // It causes 400 Errors when combined with Search Tools.
  	 	 	 // We parse the text manually below instead.
  	 	 }
  	 });

  	 let jsonString = response.text || "[]";
  	 
  	 // Robust Extraction: Find the JSON array even if model adds conversational text
  	 const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
  	 if (jsonMatch) {
  	 	 jsonString = jsonMatch[0];
  	 } else {
  	 	 // Fallback cleanup if regex fails but it looks like JSON
  	 	 jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
  	 }

  	 let parsedData;
  	 try {
  	 	 parsedData = JSON.parse(jsonString);
  	 } catch (e) {
  	 	 console.warn("Gemini JSON Parse Failed. Raw text:", response.text);
  	 	 // Return fallback on parse error to avoid "Nothing here yet" screen
  	 	 return FALLBACK_ARTICLES;
  	 }

  	 if (!Array.isArray(parsedData) || parsedData.length === 0) {
  	 	 console.warn("Gemini returned empty array, using fallback");
  	 	 return FALLBACK_ARTICLES;
  	 }

  	 // Get a batch of unique images for this page
  	 const baseImages = getUniqueCategoryImages(category, parsedData.length + page);
  	 
  	 // Hydrate with frontend-specific fields
  	 return parsedData.map((item: any, index: number) => {
  	 	 const mainImage = baseImages[index % baseImages.length];
  	 	 const extraImages = getUniqueCategoryImages(category, 3);
  	 	 
  	 	 return {
  	 	 	 id: `live-${Date.now()}-${page}-${index}`,
  	 	 	 title: item.title || "Untitled News",
  	 	 	 source: item.source || "Tech Source",
  	 	 	 publishedAt: item.publishedAt || new Date().toISOString(),
  	 	 	 url: "https://google.com/search?q=" + encodeURIComponent(item.title),
  	 	 	 summary: item.summary || "No summary available.",
  	 	 	 keyTakeaways: item.keyTakeaways || [],
  	 	 	 whyItMatters: item.whyItMatters || "Impact analysis unavailable.",
  	 	 	 content: item.content || item.summary || "",
  	 	 	 category: category as ArticleCategory,
  	 	 	 imageUrl: mainImage,
  	 	 	 images: [mainImage, ...extraImages].slice(0, 3)
  	 	 };
  	 });

  } catch (error) {
  	 console.error("Live News Fetch Error:", error);
  	 // Return fallback on network error to avoid empty screen
  	 return FALLBACK_ARTICLES;
  }
};

/**
 * Simple RAG logic.
 */
const retrieveContext = (query: string, activeArticle?: Article | null): Article[] => {
  if (activeArticle) {
  	 return [activeArticle];
  }
  return [];
};

/**
 * Sends a message to Gemini
 */
export const sendMessageToGemini = async (
  userMessage: string,
  chatHistory: ChatMessage[],
  activeArticle?: Article | null
): Promise<string> => {
  try {
  	 const ai = getAIClient();
  	 if (!ai) return "I am currently running in offline mode. Please configure your API key in the dashboard to enable chat features.";

  	 const contextArticles = retrieveContext(userMessage, activeArticle);
  	 
  	 let contextString = "";
  	 if (contextArticles.length > 0) {
  	 	 contextString = "=== INTERNAL KNOWLEDGE BASE ===\n\n";
  	 	 contextArticles.forEach((article, index) => {
  	 	 	 contextString += `Title: ${article.title}\nSource: ${article.source}\nSummary: ${article.summary}\nFull Text: ${article.content}\n\n`;
  	 	 });
  	 }

  	 const fullPrompt = `
  	 	 ${contextString}
  	 	 USER QUESTION: ${userMessage}
  	 	 
  	 	 Answer using the internal context or Google Search if needed.
  	 `;

  	 const response = await ai.models.generateContent({
  	 	 model: "gemini-2.5-flash",
  	 	 contents: fullPrompt,
  	 	 config: {
  	 	 	 systemInstruction: SYSTEM_INSTRUCTION,
  	 	 	 temperature: 0.2,
  	 	 	 tools: [{ googleSearch: {} }],
  	 	 }
  	 });

  	 let textResponse = response.text || "I apologize, but I couldn't generate a response.";

  	 const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  	 if (groundingChunks && groundingChunks.length > 0) {
  	 	 const sources = groundingChunks
  	 	 	 .filter(chunk => chunk.web?.uri && chunk.web?.title)
  	 	 	 .map(chunk => `• [${chunk.web?.title}](${chunk.web?.uri})`)
  	 	 	 .join('\n');
  	 	 if (sources) textResponse += `\n\n**Sources:**\n${sources}`;
  	 }

  	 return textResponse;

  } catch (error) {
  	 console.error("Gemini API Error:", error);
  	 return "I'm encountering trouble connecting to the AI service. Please check your API key settings.";
  }
};

export const getRecommendations = async (
  userHistory: Article[],
  allArticles: Article[]
): Promise<string[]> => {
  const ai = getAIClient();
  if (!ai || userHistory.length === 0) return [];

  try {
  	 const prompt = `
  	 	 Based on history: ${userHistory.map(h => h.title).join(', ')}
  	 	 Recommend 3 IDs from: ${allArticles.map(a => `${a.id}:${a.title}`).join(', ')}
  	 	 Return JSON: { "recommendedIds": [] }
  	 `;

  	 const response = await ai.models.generateContent({
  	 	 model: "gemini-2.5-flash",
  	 	 contents: prompt,
  	 	 config: { responseMimeType: "application/json" }
  	 });
  	 const json = JSON.parse(response.text || "{}");
  	 return json.recommendedIds || [];
  } catch (error) {
  	 return [];
  }
};

export const generateAppLogo = async (): Promise<string | null> => {
  const ai = getAIClient();
  if (!ai) return null;
  
  try {
  	 const response = await ai.models.generateContent({
  	 	 model: 'gemini-2.5-flash-image',
  	 	 contents: { parts: [{ text: 'Tech news app logo, modern, blue and cyan, vector style' }] },
  	 });
  	 for (const part of response.candidates?.[0]?.content?.parts || []) {
  	 	 if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  	 }
  	 return null;
  } catch (error) {
  	 return null;
  }
};

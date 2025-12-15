import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Article, ChatMessage, ArticleCategory, SearchFilters } from "../types";
import { MOCK_ARTICLES, SYSTEM_INSTRUCTION, getUniqueCategoryImages } from "../constants";

// Helper to get client instance with latest key
const getAIClient = () => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey: key || '' });
};

/**
 * Real-time Backend Service
 * Fetches latest news using Gemini 2.5 Flash + Google Search Tool.
 * It synthesizes search results into structured JSON.
 */
export const fetchLiveNews = async (category: string, page: number = 1, filters?: SearchFilters): Promise<Article[]> => {
  const categoryTerm = category === ArticleCategory.ALL ? "latest emerging technology, engineering blogs, and tech analysis" : category;
  
  // Build Filter Instructions
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

    if (filters.sortBy === 'newest') {
      filterInstructions += "Ordering: List the most recent events/posts first.\n";
    }
  }

  // Define Source Diversity Instructions
  const sourceDiversityInstruction = `
    CRITICAL SOURCE DIVERSITY REQUIREMENT:
    The returned articles MUST be a diverse mix of:
    1. **Official MNC/Engineering Blogs** (e.g., Google AI Blog, Netflix TechBlog, Uber Engineering, Microsoft Research, AWS Architecture Blog, Meta Engineering, Cloudflare Blog).
    2. **Expert Personal Blogs/Substacks** (e.g., renowned developers, security researchers, tech analysts like Ben Evans or Stratechery).
    3. **Mainstream Tech News** (e.g., TechCrunch, The Verge, Reuters) - ONLY if engineering blogs are not available.
    
    **PRIORITY:** Actively search for specific "Engineering Blog" posts related to "${categoryTerm}". We want deep technical insights, not just press releases.
  `;

  // Dynamic instructions based on page number to simulate pagination/infinite scroll
  let paginationInstruction = "";
  if (page === 1) {
    paginationInstruction = "Search for the top 6 most significant technical stories right now. **MANDATORY:** At least 3 results must be from official company engineering blogs (e.g. 'How we built X at Y').";
  } else {
    paginationInstruction = `
      This is page ${page} of an infinite feed.
      Task: Search for 6 *additional* and *distinct* stories.
      Prioritize:
      - Technical deep-dives/whitepapers.
      - Niche architectural breakdowns.
      - Avoid repeating major headlines found on page 1.
    `;
  }

  const prompt = `
    You are a real-time content aggregator for a professional tech platform.
    Target Topic: "${categoryTerm}".
    
    ${filterInstructions}
    ${sourceDiversityInstruction}
    ${paginationInstruction}
    
    Focus on technology, innovation, system architecture, and business impact.

    Requirements:
    1. Use the 'googleSearch' tool to find real, up-to-date information.
    2. After searching, format the results into a strictly valid JSON array.
    3. **IMPORTANT**: Return ONLY the raw JSON string. Do not use Markdown code blocks. Do not add introductory text.

    JSON Structure per article:
    {
      "title": "Headline of the story or blog post",
      "source": "Name of the publisher (e.g., 'Netflix TechBlog', 'Ben Evans')",
      "publishedAt": "Relative time (e.g., '2 days ago') or Date string",
      "summary": "A punchy, 2-sentence summary. If it's a technical blog, mention the specific problem/solution.",
      "keyTakeaways": ["Key point 1", "Key point 2", "Key point 3"],
      "whyItMatters": "One sentence explaining the industry implication or engineering lesson.",
      "content": "A slightly longer paragraph (approx 4-5 sentences) expanding on the details."
    }
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json", // Enforce JSON response type to reduce parsing errors
      }
    });

    let jsonString = response.text || "[]";
    
    // Cleanup markdown if the model ignores the instruction (though responseMimeType helps)
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData;
    try {
        parsedData = JSON.parse(jsonString);
    } catch (e) {
        console.warn("Failed to parse JSON from Gemini, attempting partial fix", jsonString);
        // Fallback: try to find array brackets
        const start = jsonString.indexOf('[');
        const end = jsonString.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            try {
                parsedData = JSON.parse(jsonString.substring(start, end + 1));
            } catch (innerE) {
                console.error("Critical JSON parse error", innerE);
                return [];
            }
        } else {
            return [];
        }
    }

    if (!Array.isArray(parsedData)) {
      console.warn("Gemini returned non-array data for news");
      return [];
    }

    // Get a batch of unique images for this page
    const baseImages = getUniqueCategoryImages(category, parsedData.length + page);
    
    // Hydrate with frontend-specific fields (IDs, Images)
    return parsedData.map((item: any, index: number) => {
       const mainImage = baseImages[index % baseImages.length];
       const extraImages = getUniqueCategoryImages(category, 3);
       
       return {
          id: `live-${Date.now()}-${page}-${index}`,
          title: item.title || "Untitled News",
          source: item.source || "Unknown Source",
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
    return [];
  }
};

/**
 * Simple RAG (Retrieval Augmented Generation) logic.
 */
const retrieveContext = (query: string, activeArticle?: Article | null): Article[] => {
  if (activeArticle) {
    return [activeArticle];
  }
  return [];
};

/**
 * Sends a message to Gemini with the retrieved context and enables Google Search.
 */
export const sendMessageToGemini = async (
  userMessage: string,
  chatHistory: ChatMessage[],
  activeArticle?: Article | null
): Promise<string> => {
  try {
    const ai = getAIClient();
    const contextArticles = retrieveContext(userMessage, activeArticle);
    
    // Construct the prompt with context
    let contextString = "";
    if (contextArticles.length > 0) {
      contextString = "=== INTERNAL KNOWLEDGE BASE (PRIORITY SOURCE) ===\n\n";
      contextArticles.forEach((article, index) => {
        contextString += `[Article ${index + 1}]\n`;
        contextString += `Title: ${article.title}\n`;
        contextString += `Source: ${article.source}\n`;
        contextString += `Published: ${article.publishedAt}\n`;
        contextString += `Summary: ${article.summary}\n`;
        contextString += `Full Text: ${article.content}\n`;
        if (article.keyTakeaways) {
            contextString += `Key Points: ${article.keyTakeaways.join('; ')}\n`;
        }
        contextString += `\n`;
      });
      contextString += "=================================================\n";
    } else {
      contextString = "CONTEXT: No exact matches in internal database. You may need to rely on Google Search.\n";
    }

    const fullPrompt = `
      ${contextString}
      
      USER QUESTION: ${userMessage}
      
      RESPONSE STRATEGY:
      1. **CHECK INTERNAL CONTEXT FIRST**: Analyze the "INTERNAL KNOWLEDGE BASE" provided above. 
         - If the answer is fully or partially present, USE IT. 
         - Do not use Google Search if the internal context answers the core of the question.
      
      2. **CITE INTERNAL SOURCES**: When using information from the internal context, you MUST cite it using the format: (Source: [Source Name]).
      
      3. **USE GOOGLE SEARCH ONLY WHEN NECESSARY**:
         - Use 'googleSearch' if the internal context is empty or completely irrelevant to the user's specific question.
         - Use 'googleSearch' if the user explicitly asks for "latest updates", "news from today", or information clearly outside the scope of the provided articles.
      
      4. **COMBINE IF NEEDED**: If the question requires both (e.g., "What does [Internal Article] say, and what happened since?"), start with the internal content, then use search to supplement.
    `;

    const modelId = "gemini-2.5-flash";

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
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

      if (sources) {
        textResponse += `\n\n**Search Sources:**\n${sources}`;
      }
    }

    return textResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm encountering trouble connecting to the AI service. Please check your API key.";
  }
};

/**
 * Generates article recommendations based on user history using Gemini.
 */
export const getRecommendations = async (
  userHistory: Article[],
  allArticles: Article[]
): Promise<string[]> => {
  if (userHistory.length === 0) return [];

  const historyIds = new Set(userHistory.map(a => a.id));
  const candidates = allArticles.filter(a => !historyIds.has(a.id));

  if (candidates.length === 0) return [];

  const historyText = userHistory.slice(0, 10).map(a => `- ${a.title} (${a.category})`).join('\n');
  const candidatesText = candidates.map(a => `ID: ${a.id} | Title: ${a.title} | Category: ${a.category} | Summary: ${a.summary}`).join('\n');

  const prompt = `
    You are an intelligent news recommendation engine.
    
    USER HISTORY (Articles read or saved):
    ${historyText}

    AVAILABLE ARTICLES (Candidates):
    ${candidatesText}

    TASK:
    Analyze the user's history to understand their interests.
    Select the top 3 articles from the 'AVAILABLE ARTICLES' list that are most relevant to this user.
    
    RETURN:
    A JSON object with a property "recommendedIds" containing an array of strings.
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return json.recommendedIds || [];
  } catch (error) {
    console.error("Recommendation Error:", error);
    return [];
  }
};

/**
 * Generates a unique app logo using Gemini 2.5 Flash Image.
 */
export const generateAppLogo = async (): Promise<string | null> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A modern, tech-centric app logo for "NowFlowAI". The icon should creatively merge a stylized newspaper or document symbol with a digital circuit board or neural network connections. Clean, geometric vector style. Colors: Electric Blue, Cyan, and Slate Grey on a white background.',
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Logo generation failed:", error);
    return null;
  }
};
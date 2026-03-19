/**
 * AI integration layer using Google Gemini.
 *
 * This module replaces the Trickle platform's `invokeAIAgent()` function.
 * It takes a system prompt + conversation history and returns the AI response.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

function initializeAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Get a free key at https://aistudio.google.com/apikey'
    );
  }
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('✅ Gemini AI initialized successfully');
}

/**
 * Generate an AI response given conversation history.
 *
 * @param {string} systemPrompt - The system instruction (role, behavior, language)
 * @param {Array} conversationHistory - Array of { role, content } from DB memory
 * @param {string} userMessage - The latest user message
 * @returns {string} The AI's response text
 *
 * Chain-of-Thought:
 * 1. We build the full prompt by combining the system instruction with
 *    the conversation history, giving the AI "memory" of the session.
 * 2. Gemini's generateContent API is stateless, so we must pass the
 *    full context each time.
 * 3. We map our DB roles ('user'/'ai') to readable labels.
 */
async function generateResponse(systemPrompt, conversationHistory, userMessage) {
  if (!model) {
    initializeAI();
  }

  // Build the conversation context from memory
  const historyText = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  const fullPrompt = `${systemPrompt}

Here is the conversation history:
${historyText}

User: ${userMessage}

Please respond to the user's latest message.`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error.message);

    if (error.message && error.message.includes('API_KEY_INVALID')) {
      throw new Error('Invalid API key. Please check your GEMINI_API_KEY in .env');
    }
    if (error.message && error.message.includes('RATE_LIMIT')) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    throw new Error(`AI generation failed: ${error.message}`);
  }
}

module.exports = { initializeAI, generateResponse };

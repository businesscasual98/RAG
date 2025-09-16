const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const VectorStore = require('./vectorStore');
const logger = require('../utils/logger');

class RAGService {
  constructor() {
    this.vectorStore = new VectorStore();
    this.llmProvider = process.env.LLM_PROVIDER || 'gemini';

    // Gemini configuration
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.genAI = this.geminiApiKey ? new GoogleGenerativeAI(this.geminiApiKey) : null;

    // OpenRouter configuration (fallback)
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY;
    this.openRouterBaseUrl = 'https://openrouter.ai/api/v1';
  }

  async processQuery(query, options = {}) {
    try {
      const {
        maxResults = 5,
        similarityThreshold = 0.0  // Lowered for demo with simple embeddings
      } = options;

      logger.info('Processing RAG query', { query: query.substring(0, 100) });

      // Step 1: Retrieve relevant documents
      const relevantDocs = await this.vectorStore.searchSimilar(query, {
        topK: maxResults,
        threshold: similarityThreshold
      });

      if (relevantDocs.length === 0) {
        logger.warn('No relevant documents found for query');
        return {
          answer: "I couldn't find any relevant information in the uploaded documents to answer your question.",
          sources: [],
          context: [],
          confidence: 0
        };
      }

      logger.info('Retrieved relevant documents', { count: relevantDocs.length });

      // Step 2: Build context from retrieved documents
      const context = this.buildContext(relevantDocs);

      // Step 3: Generate response using LLM
      const response = await this.generateResponse(query, context);

      // Step 4: Extract citations and build final response
      const citations = this.extractCitations(relevantDocs, response);

      const result = {
        answer: response,
        sources: citations,
        context: relevantDocs.map(doc => ({
          id: doc.id,
          content: doc.content.substring(0, 200) + '...',
          similarity: doc.similarity,
          metadata: {
            documentId: doc.metadata.documentId,
            originalName: doc.metadata.originalName,
            chunkIndex: doc.metadata.chunkIndex
          }
        })),
        confidence: relevantDocs.length > 0 ? relevantDocs[0].similarity : 0,
        queryProcessedAt: new Date().toISOString()
      };

      logger.info('RAG query processed successfully', {
        answeredLength: response.length,
        sourcesCount: citations.length,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      logger.error('Error processing RAG query:', error);
      throw error;
    }
  }

  buildContext(relevantDocs) {
    // Combine relevant document chunks into context
    const contextParts = relevantDocs.map((doc, index) => {
      return `[Source ${index + 1}]: ${doc.content}`;
    });

    return contextParts.join('\n\n');
  }

  async generateResponse(query, context) {
    try {
      const prompt = this.buildPrompt(query, context);

      if (this.llmProvider === 'gemini' && this.genAI) {
        return await this.generateGeminiResponse(prompt);
      } else if (this.openRouterApiKey) {
        return await this.generateOpenRouterResponse(prompt);
      } else {
        throw new Error('No LLM provider configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY');
      }

    } catch (error) {
      logger.error('Error generating LLM response:', error);
      throw error;
    }
  }

  async generateGeminiResponse(prompt) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.3,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text().trim();

      logger.info('Gemini response generated', {
        model: 'gemini-1.5-flash',
        responseLength: answer.length,
        provider: 'gemini'
      });

      return answer;

    } catch (error) {
      logger.error('Error with Gemini API:', error);

      if (error.message?.includes('API_KEY')) {
        throw new Error('Invalid Gemini API key');
      } else if (error.message?.includes('quota')) {
        throw new Error('Gemini API quota exceeded. Please try again later.');
      } else if (error.message?.includes('overloaded') || error.message?.includes('503')) {
        // Return a helpful fallback response when Gemini is overloaded
        return 'The AI service is currently overloaded. However, I found relevant information in the uploaded documents. Please check the source citations below for details.';
      }

      throw new Error('Failed to generate response from Gemini');
    }
  }

  async generateOpenRouterResponse(prompt) {
    try {
      const response = await axios.post(
        `${this.openRouterBaseUrl}/chat/completions`,
        {
          model: 'microsoft/wizardlm-2-8x22b',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that answers questions based strictly on the provided context. Always cite your sources using [Source X] notation when referencing information.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'RAG Demo'
          }
        }
      );

      const answer = response.data.choices[0].message.content.trim();

      logger.info('OpenRouter response generated', {
        model: 'microsoft/wizardlm-2-8x22b',
        responseLength: answer.length,
        tokensUsed: response.data.usage?.total_tokens || 'unknown',
        provider: 'openrouter'
      });

      return answer;

    } catch (error) {
      logger.error('Error with OpenRouter API:', error);

      if (error.response?.status === 401) {
        throw new Error('Invalid OpenRouter API key');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error('Failed to generate response from OpenRouter');
    }
  }

  buildPrompt(query, context) {
    return `You are a helpful assistant that answers questions based strictly on the provided context. Always cite your sources using [Source X] notation when referencing information.

Context information is below:
---------------------
${context}
---------------------

Based on the context information above, please answer the following question. If the answer cannot be found in the context, say so clearly. Always reference your sources using [Source X] notation.

Question: ${query}

Answer:`;
  }

  extractCitations(relevantDocs, response) {
    const citations = [];

    relevantDocs.forEach((doc, index) => {
      const sourcePattern = new RegExp(`\\[Source ${index + 1}\\]`, 'gi');

      if (sourcePattern.test(response)) {
        citations.push({
          sourceNumber: index + 1,
          documentId: doc.metadata.documentId,
          documentName: doc.metadata.originalName,
          chunkId: doc.id,
          chunkIndex: doc.metadata.chunkIndex,
          similarity: doc.similarity,
          content: doc.content.substring(0, 300) + '...'
        });
      }
    });

    // If no explicit citations found but we have relevant docs, include them anyway
    if (citations.length === 0 && relevantDocs.length > 0) {
      relevantDocs.forEach((doc, index) => {
        citations.push({
          sourceNumber: index + 1,
          documentId: doc.metadata.documentId,
          documentName: doc.metadata.originalName,
          chunkId: doc.id,
          chunkIndex: doc.metadata.chunkIndex,
          similarity: doc.similarity,
          content: doc.content.substring(0, 300) + '...',
          implicit: true
        });
      });
    }

    return citations;
  }

  async getVectorStoreInfo() {
    try {
      return await this.vectorStore.getCollectionInfo();
    } catch (error) {
      logger.error('Error getting vector store info:', error);
      throw error;
    }
  }
}

module.exports = RAGService;
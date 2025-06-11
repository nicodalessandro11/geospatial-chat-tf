/**
 * Custom hook for interacting with the AUQ NLP API
 * 
 * Provides functions to send questions to the NLP agent and get responses
 * 
 * @author Nicolas Dalessandro
 * @email nicodalessandro11@gmail.com
 */

import { useState, useCallback } from 'react';

// Types
export interface QuestionRequest {
  question: string;
  language?: 'auto' | 'es' | 'en';
  conversation_history?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
}

export interface QuestionResponse {
  success: boolean;
  question: string;
  answer: string;
  execution_time?: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  database_connected: boolean;
  openai_connected: boolean;
  agent_ready: boolean;
}

export interface ExamplesResponse {
  examples: string[];
}

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_NLP_API_URL || 'https://web-production-b7778.up.railway.app';

export const useNLPAgent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<QuestionResponse | null>(null);

  // Generic API call function
  const apiCall = useCallback(async <T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown API error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Ask a question to the NLP agent
  const askQuestion = useCallback(async (request: QuestionRequest): Promise<QuestionResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall<QuestionResponse>('/ask', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      setLastResponse(response);
      return response;
    } catch (err) {
      const errorResponse: QuestionResponse = {
        success: false,
        question: request.question,
        answer: '',
        error: err instanceof Error ? err.message : 'Failed to process question',
      };
      setLastResponse(errorResponse);
      return errorResponse;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Check API health
  const checkHealth = useCallback(async (): Promise<HealthResponse> => {
    return await apiCall<HealthResponse>('/health');
  }, [apiCall]);

  // Get example questions
  const getExamples = useCallback(async (): Promise<string[]> => {
    const response = await apiCall<ExamplesResponse>('/examples');
    return response.examples;
  }, [apiCall]);

  // Quick ask function with just a string
  const ask = useCallback(async (question: string, language?: 'auto' | 'es' | 'en'): Promise<string> => {
    const response = await askQuestion({ question, language });
    if (response.success) {
      return response.answer;
    } else {
      throw new Error(response.error || 'Failed to get answer');
    }
  }, [askQuestion]);

  return {
    // State
    isLoading,
    error,
    lastResponse,
    
    // Functions
    askQuestion,
    ask,
    checkHealth,
    getExamples,
    
    // Utilities
    clearError: () => setError(null),
    clearResponse: () => setLastResponse(null),
  };
}; 
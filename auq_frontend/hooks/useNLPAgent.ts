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

// Fallback URLs in case of DNS issues
const FALLBACK_URLS = [
  'https://web-production-b7778.up.railway.app',
  // Add more fallback URLs if needed
];

export const useNLPAgent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<QuestionResponse | null>(null);

  // Generic API call function with retry logic
  const apiCall = useCallback(async <T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    // Try each URL in sequence
    for (const baseUrl of FALLBACK_URLS) {
      try {
        const fullUrl = `${baseUrl}${endpoint}`;
        console.log(`Making API call to: ${fullUrl}`);
        
        const response = await fetch(fullUrl, {
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options?.headers,
          },
          ...options,
        });

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response success:', data);
        return data;
        
      } catch (err) {
        console.error(`API Call Error for ${baseUrl}:`, err);
        lastError = err instanceof Error ? err : new Error('Unknown error');
        
        // If this is a network error (TypeError), try next URL
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          continue;
        }
        
        // For other errors, don't retry
        break;
      }
    }
    
    // If we get here, all URLs failed
    const errorMessage = lastError?.message || 'All API endpoints failed';
    setError(errorMessage);
    throw lastError || new Error(errorMessage);
  }, []);

  // Ask a question to the NLP agent
  const askQuestion = useCallback(async (request: QuestionRequest): Promise<QuestionResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall<any>('/query', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      // Transform the response to match the expected interface
      const transformedResponse: QuestionResponse = {
        success: response.success,
        question: response.question,
        answer: response.answer,
        execution_time: response.processing_time_seconds,
        error: response.error,
      };

      setLastResponse(transformedResponse);
      return transformedResponse;
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
    const response = await apiCall<any>('/status');
    // Transform the response to match the expected interface
    return {
      status: response.status,
      database_connected: response.agent_status?.database_connected || false,
      openai_connected: response.agent_status?.agent_ready || false,
      agent_ready: response.agent_status?.agent_ready || false,
    };
  }, [apiCall]);

  // Get example questions (hardcoded since API doesn't have this endpoint)
  const getExamples = useCallback(async (): Promise<string[]> => {
    return [
      "¿Qué distrito tiene más habitantes?",
      "¿Cuántos distritos hay en total?", 
      "¿Qué distrito tiene el mayor ingreso promedio?",
      "¿Cuántos habitantes tiene Barcelona?",
      "¿Qué ciudades están disponibles en la base de datos?",
    ];
  }, []);

  // Quick ask function with just a string
  const ask = useCallback(async (question: string, language?: 'auto' | 'es' | 'en'): Promise<string> => {
    const response = await askQuestion({ question, language });
    if (response.success) {
      return response.answer;
    } else {
      throw new Error(response.error || 'Failed to get answer');
    }
  }, [askQuestion]);

  // Test function to check basic connectivity
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Try a simple fetch with minimal options
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
      });
      return response.ok;
    } catch (err) {
      console.error('Connection test failed:', err);
      return false;
    }
  }, []);

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
    testConnection,
    
    // Utilities
    clearError: () => setError(null),
    clearResponse: () => setLastResponse(null),
  };
}; 
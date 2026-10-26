
import React, { useState, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Project, Indicator } from '../../types';
import Button from '../ui/Button';
import { SparklesIcon, LightBulbIcon } from '../../constants';
import Card from '../ui/Card';

interface AIInsightsViewProps {
  activeProject: Project | null;
  projectIndicators: Indicator[];
}

const AIInsightsView: React.FC<AIInsightsViewProps> = ({ activeProject, projectIndicators }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async () => {
    if (!activeProject) {
      setError("No active project selected to generate insights for.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setInsights(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      
      const indicatorNames = projectIndicators.map(ind => ind.name).slice(0, 5); // Limit to first 5 indicators for brevity
      let promptContent = `Analyze the following Monitoring & Evaluation (M&E) project.
Project Name: ${activeProject.name}
Project Description: ${activeProject.description}
Key Indicators: ${indicatorNames.length > 0 ? indicatorNames.join(', ') : 'No specific indicators provided yet.'}

Based on this information, provide three distinct, concise (1-2 sentences each) points covering potential:
1. Strengths or opportunities for this project.
2. Challenges or risks to consider.
3. Actionable recommendations for successful M&E or project implementation.

Format your response clearly, perhaps using bullet points or numbered lists for each of the three categories.`;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17', // Use the recommended model
        contents: [{ role: "user", parts: [{text: promptContent}] }],
      });
      
      setInsights(response.text);

    } catch (e: any) {
      console.error("Error generating AI insights:", e);
      setError(`Failed to generate insights. ${e.message || 'Please ensure your API key is configured correctly and try again.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, projectIndicators]);

  if (!activeProject) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-neutral-600">Please select an active project to generate AI-powered insights.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-neutral-50 rounded-lg shadow-inner min-h-[calc(100vh-200px)]">
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b">
          <h2 className="text-2xl font-semibold text-primary-dark mb-3 sm:mb-0 flex items-center">
            <SparklesIcon className="w-7 h-7 mr-3 text-secondary" />
            AI-Powered M&E Insights for: <span className="ml-2 font-bold">{activeProject.name}</span>
          </h2>
          <Button 
            onClick={generateInsights} 
            disabled={isLoading}
            leftIcon={isLoading ? undefined : <SparklesIcon className="w-5 h-5" />}
          >
            {isLoading ? 'Generating...' : 'Generate Insights'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-neutral-600">Generating insights, please wait...</p>
          </div>
        )}

        {insights && !isLoading && (
          <div className="prose prose-sm sm:prose max-w-none p-4 bg-white rounded-md shadow">
            <h3 className="text-xl font-semibold text-primary mb-3">Generated Insights:</h3>
            {insights.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}

        {!insights && !isLoading && !error && (
          <div className="text-center py-12 bg-neutral-100 rounded-lg p-6">
            <LightBulbIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-neutral-700 mb-2">Unlock M&E Insights</h3>
            <p className="text-neutral-500 mb-6 max-w-md mx-auto">
              Click "Generate Insights" to leverage AI for identifying potential strengths, challenges, and recommendations related to your project's M&E framework and objectives.
            </p>
            <p className="text-xs text-neutral-400">
              Note: AI insights are suggestive and based on the provided project data. Always apply critical judgment.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AIInsightsView;

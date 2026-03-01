// AI Service for intelligent issue classification and analysis
export interface AIClassificationResult {
  category: string;
  priority: string;
  confidence: number;
  suggestedTitle: string;
  tags: string[];
  estimatedResolutionTime: string;
  similarIssues: number;
}

export interface AIAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: number; // 1-10 scale
  keywords: string[];
  location_confidence: number;
  description_quality: number;
}

// Mock AI classification - In real app, this would call OpenAI/Google AI APIs
export const classifyIssue = async (
  title: string,
  description: string,
  imageAnalysis?: string
): Promise<AIClassificationResult> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simple keyword-based classification (mock AI)
  const text = `${title} ${description}`.toLowerCase();
  
  let category = 'other';
  let priority = 'medium';
  let tags: string[] = [];
  let estimatedTime = '3-5 days';

  // Road-related keywords
  if (text.includes('pothole') || text.includes('road') || text.includes('street') || 
      text.includes('traffic') || text.includes('pavement') || text.includes('asphalt')) {
    category = 'roads';
    tags.push('infrastructure', 'transportation');
    if (text.includes('dangerous') || text.includes('accident')) {
      priority = 'high';
      estimatedTime = '1-2 days';
    }
  }
  
  // Water-related keywords
  else if (text.includes('water') || text.includes('leak') || text.includes('pipe') || 
           text.includes('flood') || text.includes('drainage') || text.includes('sewer')) {
    category = 'water';
    tags.push('utilities', 'infrastructure');
    if (text.includes('flood') || text.includes('burst') || text.includes('emergency')) {
      priority = 'critical';
      estimatedTime = '4-8 hours';
    }
  }
  
  // Electricity-related keywords
  else if (text.includes('light') || text.includes('electric') || text.includes('power') || 
           text.includes('lamp') || text.includes('wire') || text.includes('outage')) {
    category = 'electricity';
    tags.push('utilities', 'safety');
    if (text.includes('dark') || text.includes('safety') || text.includes('night')) {
      priority = 'high';
      estimatedTime = '1-2 days';
    }
  }
  
  // Waste-related keywords
  else if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || 
           text.includes('bin') || text.includes('dump') || text.includes('litter')) {
    category = 'waste';
    tags.push('sanitation', 'environment');
    if (text.includes('overflow') || text.includes('smell') || text.includes('pest')) {
      priority = 'medium';
      estimatedTime = '2-3 days';
    }
  }
  
  // Public facility keywords
  else if (text.includes('park') || text.includes('bench') || text.includes('playground') || 
           text.includes('building') || text.includes('facility') || text.includes('public')) {
    category = 'public';
    tags.push('facilities', 'community');
  }

  // Priority escalation based on urgency keywords
  if (text.includes('emergency') || text.includes('urgent') || text.includes('dangerous') || 
      text.includes('critical') || text.includes('immediate')) {
    priority = 'critical';
    estimatedTime = '2-6 hours';
  } else if (text.includes('important') || text.includes('serious') || text.includes('safety')) {
    priority = priority === 'low' ? 'medium' : 'high';
  }

  // Generate suggested title if current title is too short
  let suggestedTitle = title;
  if (title.length < 10) {
    const categoryNames = {
      roads: 'Road maintenance issue',
      water: 'Water supply problem',
      electricity: 'Electrical infrastructure issue',
      waste: 'Waste management concern',
      public: 'Public facility issue',
      other: 'Civic infrastructure issue'
    };
    suggestedTitle = categoryNames[category as keyof typeof categoryNames];
  }

  return {
    category,
    priority,
    confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
    suggestedTitle,
    tags,
    estimatedResolutionTime: estimatedTime,
    similarIssues: Math.floor(Math.random() * 15) + 1,
  };
};

export const analyzeIssueContent = async (
  title: string,
  description: string
): Promise<AIAnalysisResult> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const text = `${title} ${description}`.toLowerCase();
  
  // Sentiment analysis (mock)
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (text.includes('terrible') || text.includes('awful') || text.includes('worst') || 
      text.includes('angry') || text.includes('frustrated')) {
    sentiment = 'negative';
  } else if (text.includes('please') || text.includes('thank') || text.includes('appreciate')) {
    sentiment = 'positive';
  }

  // Urgency scoring (1-10)
  let urgency = 5;
  if (text.includes('emergency') || text.includes('dangerous')) urgency = 10;
  else if (text.includes('urgent') || text.includes('immediate')) urgency = 8;
  else if (text.includes('important') || text.includes('serious')) urgency = 7;
  else if (text.includes('minor') || text.includes('small')) urgency = 3;

  // Extract keywords
  const keywords = extractKeywords(text);

  return {
    sentiment,
    urgency,
    keywords,
    location_confidence: Math.random() * 0.4 + 0.6, // 60-100%
    description_quality: Math.min(description.length / 50, 1), // Quality based on length
  };
};

const extractKeywords = (text: string): string[] => {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'];
  
  return text
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 5); // Top 5 keywords
};

// Voice-to-text processing
export const processVoiceInput = async (audioUri: string): Promise<string> => {
  // Mock voice processing - In real app, use Google Speech-to-Text or similar
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const mockTranscriptions = [
    "There is a large pothole on Main Street near the intersection that is causing traffic problems",
    "The street light on Pine Avenue has been out for three days creating safety concerns",
    "Water is leaking from a broken pipe on Oak Street and flooding the sidewalk",
    "The garbage bin at Central Park is overflowing and attracting pests",
    "There is a damaged bench in the playground that needs repair"
  ];
  
  return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
};

// Smart suggestions based on location and history
export const getSmartSuggestions = async (
  latitude: number,
  longitude: number
): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    "Check for similar issues in this area",
    "Consider reporting to multiple departments",
    "Add photos for faster resolution",
    "Include specific landmark references",
    "Mention safety concerns if applicable"
  ];
};
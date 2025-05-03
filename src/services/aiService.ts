interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

const API_KEY_STORAGE_KEY = 'openai_api_key';

const getApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

export const saveApiKey = (apiKey: string): void => {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
};

async function getOpenAISuggestions(taskTitle: string, apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity assistant helping break down tasks into actionable steps. Provide 4 clear, concise suggestions for completing the task. Format your response as a simple list with each suggestion on a new line, no numbers or bullets. Keep each suggestion under 10 words if possible.'
          },
          {
            role: 'user',
            content: `How can I complete this task: ${taskTitle}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No suggestions received from API');
    }
    
    return content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[0-9-.\s]*/, '').trim())
      .slice(0, 4);
  } catch (error) {
    console.error('Error getting suggestions from OpenAI:', error);
    throw error;
  }
}

const getFallbackSuggestions = (taskTitle: string): string[] => {
  const cleanTitle = taskTitle.toLowerCase();
  
  if (cleanTitle.includes('report')) {
    return [
      "Break it down into sections",
      "Start with an outline of key points",
      "Gather necessary data first",
      "Set uninterrupted time blocks for writing"
    ];
  }
  
  if (cleanTitle.includes('meeting')) {
    return [
      "Prepare an agenda beforehand",
      "Send calendar invites with objectives",
      "Take notes during the meeting",
      "Follow up with action items"
    ];
  }
  
  if (cleanTitle.includes('design')) {
    return [
      "Start with low-fidelity wireframes",
      "Gather inspiration from similar projects",
      "Get early feedback on concepts",
      "Create a design system for consistency"
    ];
  }
  
  if (cleanTitle.includes('code') || cleanTitle.includes('develop')) {
    return [
      "Break feature into smaller tasks",
      "Write tests before implementation",
      "Use version control for changes",
      "Document your approach"
    ];
  }
  
  if (cleanTitle.includes('email') || cleanTitle.includes('message')) {
    return [
      "Draft key points first",
      "Keep it concise and focused",
      "Proofread before sending",
      "Use a clear subject line"
    ];
  }
  
  return [
    "Break the task into smaller steps",
    "Set a specific deadline",
    "Identify resources you'll need",
    "Remove distractions before starting"
  ];
};

export const generateTaskSuggestions = async (taskTitle: string): Promise<string[]> => {
  console.log(`Generating AI suggestions for: ${taskTitle}`);
  
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.log('No API key found, using fallback suggestions');
    return getFallbackSuggestions(taskTitle);
  }
  
  try {
    const suggestions = await getOpenAISuggestions(taskTitle, apiKey);
    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions with AI API, using fallback:', error);
    return getFallbackSuggestions(taskTitle);
  }
};

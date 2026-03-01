// Voice-to-Text Configuration
export const VOICE_CONFIG = {
  // OpenAI Whisper API (Recommended for simplicity)
  OPENAI_API_KEY: 'sk-your-openai-api-key-here', // Replace with your OpenAI API key
  
  // AWS Transcribe Configuration (Alternative)
  AWS_CONFIG: {
    region: 'us-east-1',
    accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
    bucketName: 'your-s3-bucket-name',
  },
  
  // Recording Settings
  RECORDING_OPTIONS: {
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
    maxDuration: 60000, // 60 seconds max
  },
  
  // Supported Languages
  LANGUAGES: {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'hi-IN': 'Hindi (India)',
    'es-ES': 'Spanish',
    'fr-FR': 'French',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  OPENAI_WHISPER: 'https://api.openai.com/v1/audio/transcriptions',
  AWS_TRANSCRIBE: 'https://transcribe.{region}.amazonaws.com/',
  GOOGLE_SPEECH: 'https://speech.googleapis.com/v1/speech:recognize',
};
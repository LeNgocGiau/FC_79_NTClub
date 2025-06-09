# FCHCMUST Bảng Chiến Thuật

Ứng dụng tạo chiến thuật bóng đá với tích hợp Gemini AI Chatbot.

## Gemini Chatbot Integration

This project includes a Gemini AI-powered chatbot sidebar that provides assistance and can answer questions about football tactics and other topics.

### Setup Instructions

1. Create a `.env.local` file in the root of your project with your Gemini API key:

```
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

2. Get your Gemini API key from https://aistudio.google.com/app/apikey

3. The chatbot sidebar can be toggled by clicking the message icon in the top-right corner of the application.

### Features

- Real-time AI assistance using Gemini 2.0 Flash
- Secure API implementation with server-side and client-side options
- Clean user interface with chat history and loading indicators
- Responsive design that works on mobile and desktop

## Development

This is a Next.js project with TypeScript and Tailwind CSS.

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

4. Link demo:
[https://fc-79-nhatrang-club.vercel.app]  
   

## Technologies Used

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Google Gemini 2.0 Flash API 

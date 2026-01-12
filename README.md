<<<<<<< HEAD
t# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
=======
# LinguaStream

Learn languages with YouTube videos - An interactive language learning platform that transforms YouTube videos into personalized language lessons.

## Features

- 🎥 **Video Processing**: Extract transcripts from YouTube videos
- 📚 **Reading Practice**: Interactive reading exercises with vocabulary support
- ✍️ **Writing Practice**: AI-powered writing feedback
- 🎯 **Quiz Generation**: Auto-generated comprehension quizzes
- 📖 **Vocabulary Management**: Save and review new words
- 🔄 **Translation**: Word and sentence translation with context awareness

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: Groq SDK (LLM)
- **Video Processing**: YouTube Caption Extractor

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project (for authentication and database)
- Groq API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd studio-main
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see [Environment Variables](#environment-variables) section below)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

### Required for Production

The following environment variables must be set in your hosting platform (e.g., Vercel):

#### Firebase Configuration (Client-side)

These variables are prefixed with `NEXT_PUBLIC_` because they're used in the browser:

- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API Key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase Auth Domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase Project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase Storage Bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase Messaging Sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase App ID

**Note**: If these variables are not set, the app will fall back to default values (hardcoded in `src/firebase/config.ts`). However, for production, it's recommended to use environment variables for better environment management.

#### Groq API Key (Server-side)

- `GROQ_API_KEY` - Your Groq API key for AI features (translation, quiz generation, writing feedback)

**Important**: This is a server-side secret. Do NOT prefix it with `NEXT_PUBLIC_`. It's only used in server actions (`'use server'` files).

### Setting Environment Variables in Vercel

1. Go to your project settings in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable listed above
4. Select the appropriate environments (Production, Preview, Development)
5. Redeploy your application

### Local Development

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Groq API Key (Server-side)
GROQ_API_KEY=your-groq-api-key
```

**Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

## Firebase Setup

### Firestore Rules

The project includes Firestore security rules in `firestore.rules`. These rules enforce:

- User-based data isolation (users can only access their own data)
- Path-based ownership validation
- Relational integrity checks

To deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

### Firebase Authentication

Make sure to configure:

1. **Authentication Providers**: Enable Email/Password and Google Sign-In in Firebase Console
2. **Authorized Domains**: Add your Vercel domain to authorized domains in Firebase Console
3. **Redirect URLs**: Configure OAuth redirect URLs for Google Sign-In

## Building for Production

```bash
npm run build
npm start
```

The build script automatically detects the production environment. On Vercel, the build process runs automatically on each deployment.

## Project Structure

```
studio-main/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── firebase/         # Firebase configuration and hooks
│   ├── ai/               # AI flows (Groq integrations)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── context/         # React context providers
├── firestore.rules       # Firestore security rules
├── next.config.js        # Next.js configuration
└── package.json         # Dependencies and scripts
```

## Security Notes

- **Firebase API Keys**: While Firebase API keys are safe to expose in client-side code, using environment variables allows better environment separation (dev/staging/production)
- **Groq API Key**: Must remain server-side only. Never expose it in client-side code
- **Firestore Rules**: Always deploy and test Firestore rules before going to production

## Troubleshooting

### Build Fails

- Ensure all environment variables are set in your hosting platform
- Check that `GROQ_API_KEY` is set (required for AI features)
- Verify Firebase configuration variables are correct

### AI Features Not Working

- Verify `GROQ_API_KEY` is set correctly in environment variables
- Check server logs for API errors
- Ensure the Groq API key has sufficient quota

### Firebase Authentication Issues

- Verify Firebase project configuration
- Check authorized domains in Firebase Console
- Ensure OAuth redirect URLs are configured correctly

## License

Private - All rights reserved

## Support

For issues and questions, please contact the development team.
>>>>>>> 3666ee5 (cursor cod)

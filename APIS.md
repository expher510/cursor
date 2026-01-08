# APIs and Services Used in LinguaStream

This document provides a summary of the external APIs and services used in this project.

## 1. Firebase

Firebase is the primary backend platform for this application, providing authentication and database services.

-   **Service**: Firebase Authentication
-   **Usage**: Manages user sign-in with Google and Email/Password. This requires the **Identity Toolkit API** to be enabled in your Google Cloud project.
-   **API Key**: The Firebase API key is located in `src/firebase/config.ts` and is safe to be public.
-   **Website**: [firebase.google.com/docs/auth](https://firebase.google.com/docs/auth)

-   **Service**: Firestore
-   **Usage**: A NoSQL database used to store all user data, including video history, transcripts, and saved vocabulary lists.
-   **Website**: [firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore)

## 2. Google Cloud for YouTube Data

-   **Service**: YouTube Data API v3
-   **Usage**: Used to fetch essential video metadata, such as the title and description. This requires a **YouTube Data API Key** to be added to your `.env` file. See `.env.example` for the required format.
-   **API Key**: This key is **secret** and should be stored in the `.env` file.
-   **Website**: [developers.google.com/youtube/v3](https://developers.google.com/youtube/v3)

## 3. Translation

-   **Service**: MyMemory API
-   **Usage**: A free, public API used for translating individual words for the vocabulary list. No API key is required.
-   **Website**: [mymemory.translated.net/doc/spec.php](https://mymemory.translated.net/doc/spec.php)

## 4. Transcript Fetching

-   **Service**: `youtube-transcript` (Library Logic)
-   **Usage**: The application uses internal logic equivalent to this library to scrape and fetch transcripts for YouTube videos directly. It does not require an API key.

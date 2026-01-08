# APIs and Services Used in LinguaStream

This document provides a summary of the external APIs and services used in this project.

## 1. Firebase

Firebase is the primary backend platform for this application, providing authentication and database services.

-   **Service**: Firebase Authentication
-   **Usage**: Manages user sign-in with Google and Email/Password. This requires the **Identity Toolkit API** to be enabled in your Google Cloud project.
-   **Website**: [firebase.google.com/docs/auth](https://firebase.google.com/docs/auth)

-   **Service**: Firestore
-   **Usage**: A NoSQL database used to store all user data, including video history, transcripts, and saved vocabulary lists.
-   **Website**: [firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore)

## 2. Google Cloud for YouTube Data

-   **Service**: YouTube Data API v3
-   **Usage**: Used to fetch essential video metadata, such as the title and description. This requires a **YouTube Data API Key** to be added to your `.env` file. Without this key, video titles will not be fetched.
-   **Website**: [developers.google.com/youtube/v3](https://developers.google.com/youtube/v3)

## 3. Translation and AI

-   **Service**: MyMemory API
-   **Usage**: A free, public API used for translating individual words for the vocabulary list. No API key is required.
-   **Website**: [mymemory.translated.net/doc/spec.php](https://mymemory.translated.net/doc/spec.php)

-   **Service**: youtube-transcript (Library)
-   **Usage**: An open-source library used to scrape and fetch transcripts for YouTube videos directly. It does not require an API key.

## Deprecated APIs (No Longer Used)

-   **Supadata**: This service was previously considered but has been replaced by a direct implementation using `youtube-transcript` and the YouTube Data API.
-   **Genkit**: AI features were temporarily removed to resolve dependency conflicts.

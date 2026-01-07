# APIs and Services Used in LinguaStream

This document provides a summary of the external APIs and services used in this project.

## 1. Firebase

Firebase is the primary backend platform for this application, providing authentication and database services.

-   **Service**: Firebase Authentication
-   **Usage**: Manages user sign-in, currently using anonymous authentication.
-   **Website**: [firebase.google.com/docs/auth](https://firebase.google.com/docs/auth)

-   **Service**: Firestore
-   **Usage**: A NoSQL database used to store all user data, including video history, transcripts, and saved vocabulary lists.
-   **Website**: [firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore)

## 2. Genkit with Google AI

Genkit is the AI framework used to integrate generative AI features into the application. It is configured to use Google's Gemini models.

-   **Service**: Genkit
-   **Usage**: Orchestrates AI flows for tasks like processing videos and translating words.
-   **Website**: [firebase.google.com/docs/genkit](https://firebase.google.com/docs/genkit)

-   **Service**: Google AI (Gemini)
-   **Usage**: The underlying AI model used by Genkit for its generative capabilities.
-   **Website**: [ai.google.dev](https://ai.google.dev/)

## 3. Supadata (for Transcripts)

This is a third-party service used to fetch transcripts for YouTube videos.

-   **Service**: Supadata Transcript API
-   **Usage**: The primary method for fetching video transcripts, as seen in the `processVideoFlow`.
-   **Website**: [docs.supadata.ai/reference/transcript](https://docs.supadata.ai/reference/transcript)

## 4. MyMemory Translation API

A free, public API used for translating individual words for the vocabulary list.

-   **Service**: MyMemory API
-   **Usage**: Translates saved vocabulary words from English to Arabic.
-   **Website**: [mymemory.translated.net/doc/spec.php](https://mymemory.translated.net/doc/spec.php)

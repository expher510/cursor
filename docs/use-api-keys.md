
Use API keys to access APIs

bookmark_border
This page describes how to use API keys to access Google Cloud APIs and services that accept API keys.

Not all Google Cloud APIs accept API keys to authorize usage. Review the documentation for the service or API that you want to use to determine whether it accepts API keys.

For information about creating and managing API keys, including restricting API keys, see Manage API keys.

For information about using API keys with Google Maps Platform, see the Google Maps Platform documentation. For more information about the API Keys API, see the API Keys API documentation.
Before you begin
Select the tab for how you plan to use the samples on this page:

C#
C++
Go
Node.js
Python
REST
To use the Node.js samples on this page in a local development environment, install and initialize the gcloud CLI, and then set up Application Default Credentials with your user credentials.

Install the Google Cloud CLI.

If you're using an external identity provider (IdP), you must first sign in to the gcloud CLI with your federated identity.

If you're using a local shell, then create local authentication credentials for your user account:



gcloud auth application-default login
You don't need to do this if you're using Cloud Shell.

If an authentication error is returned, and you are using an external identity provider (IdP), confirm that you have signed in to the gcloud CLI with your federated identity.

For more information, see Set up ADC for a local development environment in the Google Cloud authentication documentation.

Using an API key with REST
To include an API key with a REST API call, use the x-goog-api-key HTTP header, as shown in the following example:


curl -X POST \
    -H "X-goog-api-key: API_KEY" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d @request.json \
    "https://translation.googleapis.com/language/translate/v2"
If you can't use the HTTP header, you can use the key query parameter. However, this method includes your API key in the URL, exposing your key to theft through URL scans.

The following example shows how to use the key query parameter with a Cloud Natural Language API request for documents.analyzeEntities. Replace API_KEY with the key string of your API key.


POST https://language.googleapis.com/v1/documents:analyzeEntities?key=API_KEY
Using an API key with client libraries
This example uses the Cloud Natural Language API, which accepts API keys, to demonstrate how you would provide an API key to the library.

C#
C++
Go
Node.js
Python
Ruby
To run this sample, you must install the Natural Language client library.





const {
  v1: {LanguageServiceClient},
} = require('@google-cloud/language');

/**
 * Authenticates with an API key for Google Language service.
 *
 * @param {string} apiKey An API Key to use
 */
async function authenticateWithAPIKey(apiKey) {
  const language = new LanguageServiceClient({apiKey});

  // Alternatively:
  // const {GoogleAuth} = require('google-auth-library');
  // const auth = new GoogleAuth({apiKey});
  // const language = new LanguageServiceClient({auth});

  const text = 'Hello, world!';

  const [response] = await language.analyzeSentiment({
    document: {
      content: text,
      type: 'PLAIN_TEXT',
    },
  });

  console.log(`Text: ${text}`);
  console.log(
    `Sentiment: ${response.documentSentiment.score}, ${response.documentSentiment.magnitude}`,
  );
  console.log('Successfully authenticated using the API key');
}

authenticateWithAPIKey();
When you use API keys in your applications, ensure that they are kept secure during both storage and transmission. Publicly exposing your API keys can lead to unexpected charges on your account. For more information, see Best practices for managing API keys.

What's next
See an overview of authentication methods.
Learn more about the API Keys API.

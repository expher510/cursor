
'use client';
import type { Auth, User } from 'firebase/auth';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface FirebaseAuthToken {
  name: string | null;
  email: string | null;
  email_verified: boolean;
  phone_number: string | null;
  sub: string;
  firebase: {
    identities: Record<string, any>;
    sign_in_provider: string;
    tenant: string | null;
  };
}

interface FirebaseAuthObject {
  uid: string;
  token: FirebaseAuthToken;
}

interface SecurityRuleRequest {
  auth: FirebaseAuthObject | null;
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

function buildAuthObject(currentUser: User | null): FirebaseAuthObject | null {
  if (!currentUser) {
    return null;
  }
  
  const identities: Record<string, any> = {};
  currentUser.providerData.forEach(profile => {
    if (profile.providerId) {
      identities[profile.providerId] = [profile.uid];
    }
  });

  const token: FirebaseAuthToken = {
    name: currentUser.displayName,
    email: currentUser.email,
    email_verified: currentUser.emailVerified,
    phone_number: currentUser.phoneNumber,
    sub: currentUser.uid,
    firebase: {
      identities,
      sign_in_provider: currentUser.providerId,
      tenant: currentUser.tenantId,
    },
  };

  return {
    uid: currentUser.uid,
    token: token,
  };
}


function buildRequestObject(context: SecurityRuleContext, auth: Auth): SecurityRuleRequest {
  const currentUser = auth.currentUser;
  const authObject = buildAuthObject(currentUser);

  return {
    auth: authObject,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    ...(context.requestResourceData && { resource: { data: context.requestResourceData } }),
  };
}


function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  return `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(requestObject, null, 2)}`;
}


export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext, auth: Auth) {
    const requestObject = buildRequestObject(context, auth);
    super(buildErrorMessage(requestObject));
    this.name = 'FirebaseError';
    this.request = requestObject;
    
    // This is to make sure that the error is re-thrown in the console
    // so it's visible in the dev tools.
    setTimeout(() => {
        throw this;
    }, 0);
  }
}

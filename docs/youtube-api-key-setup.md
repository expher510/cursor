
anage API keys

bookmark_border
This page describes how to create, edit, and restrict API keys. For information about how to use API keys to access Google APIs, see Use API keys to access APIs.

Introduction to API keys
There are two types of API keys: standard API keys, and API keys that have been bound to a service account.

Standard API keys
Standard API keys provide a way to associate a request with a project for billing and quota purposes. When you use a standard API key (an API key that has not been bound to a service account) to access an API, the API key doesn't identify a principal. Without a principal, the request can't use Identity and Access Management (IAM) to check whether the caller is authorized to perform the requested operation.

Standard API keys can be used with any API that accepts API keys, unless API restrictions have been added to the key. Standard API keys can't be used with services that don't accept API keys, including in express mode.

API keys bound to a service account
API keys bound to a service account provide the identity and authorization of the service account to a request. When you use an API key that has been bound to a service account to access an API, your request is processed as if you used the bound service account to make the request.

The only API that supports bound API keys is aiplatform.googleapis.com.

Caution: API keys bound to service accounts are designed to accelerate the initial experience for developers exploring Google Cloud APIs. Don't use them in production environments. Instead, plan to migrate to more secure alternatives such as IAM policies and short-lived service account credentials, following least-privilege security practices. Read more about the risks of API keys bound to service accounts.
Binding keys to a service account is prevented by a default organization policy constraint. To change this, see Enable key binding to service accounts.

Note: Requests authenticated by API keys bound to service accounts aren't recorded in service account usage metrics.
API key components
An API key has the following components, which let you manage and use the key:

String
The API key string is an encrypted string, for example, AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe. When you use an API key to access an API, you always use the key's string. API keys don't have an associated JSON file.
ID
The API key ID is used by Google Cloud administrative tools to uniquely identify the key. The key ID can't be used to access APIs. The key ID can be found in the URL of the key's edit page in the Google Cloud console. You can also get the key ID by using the Google Cloud CLI to list the keys in your project.
Display name
The display name is an optional, descriptive name for the key, which you can set when you create or update the key.
Bound service account
API keys that are bound to a service account include the service account's email address.
Before you begin
Complete the following tasks to use the samples on this page.

Set up authentication
Select the tab for how you plan to use the samples on this page:

Console
gcloud
C++
Java
Python
REST
When you use the Google Cloud console to access Google Cloud services and APIs, you don't need to set up authentication.

Required roles
To get the permissions that you need to manage API keys, ask your administrator to grant you the following IAM roles on your project:

API Keys Admin (roles/serviceusage.apiKeysAdmin)
Restrict an API key to specific APIs by using the Google Cloud console: Service Usage Viewer (roles/serviceusage.serviceUsageViewer)
For more information about granting roles, see Manage access to projects, folders, and organizations.

You might also be able to get the required permissions through custom roles or other predefined roles.

Enable key binding to service accounts
Before you can bind an API key to a service account, you first need to set the constraints/iam.managed.disableServiceAccountApiKeyCreation organization policy constraint to false. Changing the organization policy requires an associated organization resource. Projects without an organization aren't supported.

To change the policy constraint, complete the following instructions.

Console
gcloud
In the Google Cloud console, go to the Organization policies page.


Go to Organization policies

Switch to the organization, folder, or project you want to change the policies for.

In the Filter box, enter Block service, and then click the filter name Block service account API key bindings.

Click Manage policy.

In the Policy source section, select Override parent's policy.

Click Add a rule, and set Enforcement to Off.

Click Done.

Optional: Click Test changes to give you insight on how the proposed policy might cause compliance violations or disruptions.

Click Set policy.


Create an API key
To create an API key, use one of the following options:

Console
gcloud
C++
Java
Python
REST
In the Google Cloud console, go to the Credentials page:

Go to Credentials

Click Create credentials, and then select API key from the menu.

Optional: To bind the API key to a service account, select the Authenticate API calls through a service account checkbox and then click Select a service account to select the service account you want to bind to the key.

For more information, see API keys bound to a service account.

Add API key restrictions.

Restricting API keys is a best practice. For more information, see Apply API key restrictions.

Click Create. The API key created dialog displays the string for your newly created key.

Important: Copy your key string and keep it secure. Use API key restrictions to limit how the key can be used.

Apply API key restrictions
API keys are unrestricted by default. Unrestricted keys are insecure because they can be used by anyone from anywhere. For production applications, you should set both application restrictions and API restrictions.


Add application restrictions
Application restrictions specify which websites, IP addresses, or apps can use an API key.

You can apply only one application restriction type at a time. Choose the restriction type based on your application type:

Option	Application type	Notes
Websites	Web applications	Specifies the websites that can use the key.
IP addresses	Applications called by specific servers	Specifies the servers or cron jobs that can use the key. This is the only restriction available if you bind your API key to a service account.
Android apps	Android applications	Specifies the Android application that can use the key.
iOS apps	iOS applications	Specifies the iOS bundles that can use the key.

Websites
To restrict the websites that can use your API key, you add one or more HTTP referrer restrictions.

You can substitute a wildcard character (*) for the subdomain or the path, but you can't insert a wildcard character into the middle of a URL. For example, *.example.com is valid, and accepts all sites ending in .example.com. However, mysubdomain*.example.com is not a valid restriction.

Port numbers can be included in HTTP referrer restrictions. If you include a port number, then only requests using that port are matched. If you don't specify a port number, then requests from any port number are matched.

The following table shows some example scenarios and browser restrictions:

Scenario	Restrictions
Allow a specific URL	Add a URL with an exact path. For example:
www.example.com/path
www.example.com/path/path
Some browsers implement a referrer policy that sends only the origin URL for cross-origin requests. Users of these browsers can't use keys with page-specific URL restrictions.

Allow any URL in your site	You must set two URLs in the allowedReferers list.
URL for the domain, without a subdomain, and with a wildcard for the path. For example:
example.com/*
A second URL that includes a wildcard for the subdomain and a wildcard for the path. For example:
*.example.com/*
Allow any URL in a single subdomain or naked domain	
You must set two URLs in the allowedReferers list to allow an entire domain:

URL for the domain, without a trailing slash. For example:
www.example.com
sub.example.com
example.com
A second URL for the domain that includes a wildcard for the path. For example:
www.example.com/*
sub.example.com/*
example.com/*
To restrict your API key to specific websites, use one of the following options:

Console
gcloud
Java
Python
REST
In the Google Cloud console, go to the Credentials page:

Go to Credentials

Click the name of the API key that you want to restrict.

In the Application restrictions section, select HTTP referrers.

For each restriction that you want to add, click Add an item, enter the restriction, and click Done.

Click Save to save your changes and return to the API key list.

IP addresses
You can specify the external IP addresses of the callers (such as web servers or cron jobs) that are allowed to use your API keys. You can specify IP addresses in the following formats:

IPv4 (198.51.100.1)

IPv6 (2001:db8::1)

A subnet using CIDR notation (198.51.100.0/24, 2001:db8::/64)

Internal IP addresses and localhost aren't supported.

Note: Private Google Access uses internal IP addresses by design. To restrict API key usage to a specific network when using Private Google Access, set up a VPC Service Controls perimeter instead.
To restrict your API key to specific external IP addresses, use one of the following options:

Console
gcloud
Java
Python
REST
In the Google Cloud console, go to the Credentials page:

Go to Credentials

Click the name of the API key that you want to restrict.

In the Application restrictions section, select IP addresses.

For each IP address that you want to add, click Add an item, enter the address, and click Done.

Click Save to save your changes and return to the API key list.

Android apps
You can restrict usage of an API key to specific Android apps. You must provide the package name and the 20-byte SHA-1 certificate fingerprint for each app.

When you use the API key in a request, you must specify the package name and certificate fingerprint by using the following HTTP headers:

X-Android-Package
X-Android-Cert
Note: Bypassing this restriction is straightforward. If you use this restriction, you should also add API restrictions and monitor usage carefully.
To restrict your API key to one or more Android apps, use one of the following options:

Console
gcloud
Java
Python
REST
In the Google Cloud console, go to the Credentials page:

Go to Credentials

Click the name of the API key that you want to restrict.

In the Application restrictions section, select Android apps.

For each Android app that you want to add, click Add an item and enter the package name and SHA-1 certificate fingerprint, then click Done.

Click Save to save your changes and return to the API key list.

iOS apps
You can restrict usage of an API key to specific iOS apps by providing the bundle ID of each app.

When you use the API key in a request, you must specify the bundle ID by using the X-Ios-Bundle-Identifier HTTP header.

Note: Bypassing this restriction is straightforward. If you use this restriction, you should also add API restrictions and monitor usage carefully.
To restrict your API key to one or more iOS apps, use one of the following options:

Console
gcloud
Java
Python
REST
In the Google Cloud console, go to the Credentials page:

Go to Credentials

Click the name of the API key that you want to restrict.

In the Application restrictions section, select iOS apps.

For each iOS app that you want to add, click Add an item and enter the bundle ID, then click Done.

Click Save to save your changes and return to the API key list.

Add API restrictions
API restrictions specify which APIs can be called using the API key.

Note: Before you can specify an API for an API restriction, the API must be enabled for your project. To enable an API, go to the API dashboard.
To add API restrictions, use one of the following options:

Console
gcloud
Java
Python
REST
In the Google Cloud console, go to the Credentials page:

Go to Credentials

Click the name of the API key that you want to restrict.

In the API restrictions section, click Restrict key.

Select all APIs that your API key will be used to access.

Click Save to save your changes and return to the API key list.

Get project information from a key string
You can determine which Google Cloud project an API key is associated with from its string.

Replace KEY_STRING with the key string you need project information for.

gcloud
Java
Python
REST
You use the gcloud services api-keys lookup command to get the project ID from a key string.



 gcloud services api-keys lookup KEY_STRING
 
Create a copy of an API key
If you need a new API key with the same restrictions as an existing API key, you can create a copy of the existing API key. This operation creates a new API key with a unique key string and ID, with the existing API key's restrictions.

The copy operation is available only in the Google Cloud console. To use other methods, follow the steps to create an API key, and then apply the same API key restrictions to the newly generated API key.

In the Google Cloud console, go to the Credentials page:

Go to Credentials

Click the name of the API key that you want to copy.

The API key's details page opens.

Click Create a copy.

Enter a name for the new API key and confirm that the restrictions are correct.

Click Create.

Rotate an API key
By periodically rotating your API keys, you can limit the impact of any compromised API keys.

When you rotate an API key, you create a new key with the same restrictions as the old key, and update your applications to use the new key. After all of your applications are updated, you delete the old key.

The rotation operation is available only in the Google Cloud console. To use other methods, follow the steps to create an API key, and then apply the same API key restrictions to the newly generated API key. After updating your applications to use the new key, you delete the old key.

In the Google Cloud console, go to the Credentials page:

Go to Credentials

Click the name of the API key that you want to rotate to open its details page.

Click Rotate key.

Enter a name for the new API key and confirm that the restrictions are correct.

Click Create.

Copy the key string and update your applications to use the new string.

After you have updated all applications to use the new key, return to the details page for the new key. In the Previous key section, click Delete the previous key to delete the old key.

If you find that you deleted the old key prematurely, you can undelete it.

Undelete an API key
If you delete an API key by mistake, you can undelete (restore) that key within 30 days of deleting the key. After 30 days, you cannot undelete the API key.

Console
gcloud
Java
REST
In the Google Cloud console, go to the Credentials page:

Go to Credentials

Click Restore deleted credentials.

Find the deleted API key that you want to undelete, and click Restore.

Undeleting an API key may take a few minutes to propagate. After propagation, the undeleted API key is displayed in the API keys list.

Determine the API key type
You can determine whether the API key is bound to a service account by inspecting the key.

Console
gcloud
In the Google Cloud console, go to the Credentials page:

Go to Credentials

If the API key is bound to a service account, the service account identifier is displayed.

Poll long-running operations
API Keys API methods use long-running operations. If you use the REST API to create and manage API keys, an operation object is returned from the initial method request. You use the operation name to poll the long-running operation. When the long-running request completes, polling the operation returns the data from the long-running request.

To poll a long-running API Keys API operation, you use the operations.get method.

Replace OPERATION_NAME with the operation name returned by the long-running operation. For example, operations/akmf.p7-358517206116-cd10a88a-7740-4403-a8fd-979f3bd7fe1c.



curl -X GET \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json; charset=utf-8" \
    "https://apikeys.googleapis.com/v2/OPERATION_NAME"
Limits on API keys
You can create up to 300 API keys per project. This limit is a system limit, and can't be changed using a quota increase request. If more API keys are needed, you must use more than one project.

You can add up to 1200 application restrictions to an API key.

What's next
Learn about best practices for keeping your API keys secure.
Learn more about the API Keys API.

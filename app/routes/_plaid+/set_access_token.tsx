// app/routes/api/set_access_token.tsx

import { 
  type ActionFunctionArgs, 
  json 
} from '@remix-run/node';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { requireUserId } from '#app/utils/auth.server.ts'

// Define environment variables
const PLAID_ENV: keyof typeof PlaidEnvironments = process.env.PLAID_ENV as keyof typeof PlaidEnvironments;
const PLAID_CLIENT_ID: string = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET: string = process.env.PLAID_SECRET || '';

// Create the Plaid client configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
});

// Instantiate the Plaid client
const client = new PlaidApi(configuration);

export let PUBLIC_TOKEN: string | undefined;
export let ACCESS_TOKEN: string | undefined;
export let ITEM_ID: string | undefined;

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request)
  try {
    const formData = await request.formData();
    PUBLIC_TOKEN = formData.get('public_token') as string;

    const tokenResponse = await client.itemPublicTokenExchange({
      public_token: PUBLIC_TOKEN,
    });

    // Optional: Implement your prettyPrintResponse function or remove this line
    // prettyPrintResponse(tokenResponse);

    ACCESS_TOKEN = tokenResponse.data.access_token;
    ITEM_ID = tokenResponse.data.item_id;

    //save item id and access token to database, do not pass to frontend in production

    return json({
      // the 'access_token' is a private token, DO NOT pass this token to the frontend in your production environment
      access_token: ACCESS_TOKEN,
      item_id: ITEM_ID,
      error: null,
    });
  } catch (error: any) {
    console.error(error);
    return json({ error: error.message }, { status: 500 });
  }
};

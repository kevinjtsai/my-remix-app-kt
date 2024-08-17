// app/routes/api/create_link_token.tsx

import { 
  json,
  type ActionFunctionArgs 
} from '@remix-run/node';
import { 
  Configuration, 
  type CountryCode,
  type LinkTokenCreateRequest, 
  PlaidApi, 
  PlaidEnvironments,
  Products
} from 'plaid';
import { requireUserId } from '#app/utils/auth.server.ts'

// Define environment variables
const PLAID_ENV: keyof typeof PlaidEnvironments = process.env.PLAID_ENV as keyof typeof PlaidEnvironments;
const PLAID_CLIENT_ID: string = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET: string = process.env.PLAID_SECRET || '';
const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || Products.Transactions).split(',',) as Products[];
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',',) as CountryCode[];

console.log(`PLAID_CLIENT_ID: ${PLAID_CLIENT_ID}`)
console.log(`PLAID-SECRET: ${PLAID_SECRET}`)

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

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireUserId(request)
  try {
    const configs: LinkTokenCreateRequest = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: 'user-id',
      },
      client_name: 'Plaid Quickstart',
      products: PLAID_PRODUCTS || '',
      country_codes: PLAID_COUNTRY_CODES || '',
      language: 'en',
    };

    const createTokenResponse = await client.linkTokenCreate(configs);
    console.log(`createTokenResponse.data: ${createTokenResponse.data}`)

    // Optional: Implement your prettyPrintResponse function or remove this line
    // prettyPrintResponse(createTokenResponse);
    
    return json(createTokenResponse.data);
  } catch (error: any) {
    console.error(error);
    return json({ error: error.message }, { status: 500 });
  }
};

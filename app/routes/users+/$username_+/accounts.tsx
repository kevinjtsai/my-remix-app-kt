import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { useCallback, useContext, useEffect, useState } from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { prisma } from '#app/utils/db.server.ts'

import Link from "../../../components/plaid-link.tsx";
import Context from "../../../utils/plaid-provider.tsx";

export async function loader({ params }: LoaderFunctionArgs) {
	const owner = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			image: { select: { id: true } },
			notes: { select: { id: true, title: true } },
		},
		where: { username: params.username },
	})

	invariantResponse(owner, 'Owner not found', { status: 404 })

	return json({ owner })
}

let isHydrating = true;

export default function AccountsRoute() {
  const [isHydrated, setIsHydrated] = useState(
    !isHydrating
  );

  console.log("AccountsRoute()")
  const { dispatch } = useContext(Context);

  console.log(`Context: ${Context}`)
  console.log(`useContext(Context): ${useContext(Context)}`)
  console.log(`dispatch: ${dispatch}`)

  const generateToken = useCallback(
    async () => {
      // Link tokens for 'payment_initiation' use a different creation flow in your backend.
      console.log('generateToken was called')

      const path = "/create_link_token";
      const response = await fetch(path, {
        method: "POST",
      });
      if (!response.ok) {
        dispatch({ type: "SET_STATE", state: { linkToken: null } });
        return;
      }

      interface LinkError { 
        error_message: string; 
        error_code: string; 
        error_type: string; 
      }
      interface LinkToken {
        link_token: string,
        error: LinkError,
      }
      const isLinkTokenResponse = (object: unknown): object is LinkToken => {
        return !!object && typeof object === 'object' && typeof ((object as Record<string, unknown>)['link_token']) === 'string'
      }
      const data = await response.json();

      console.log(`link token data: ${JSON.stringify(data)}`)
      console.log(`isLinkToken?: ${isLinkTokenResponse(data)}`)

      if (isLinkTokenResponse(data)) {
        if (data.error != null) {
          dispatch({
            type: "SET_STATE",
            state: {
              linkToken: null,
              linkTokenError: data.error,
            },
          });
          return;
        }
        console.log(`set linkToken to state: ${data.link_token}`)
        dispatch({ type: "SET_STATE", state: { linkToken: data.link_token } });
      }
      if (isLinkTokenResponse(data)) {
        // Save the link_token to be used later in the Oauth flow.
        localStorage.setItem("link_token", data.link_token);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    console.log('accounts useEffect()')

    isHydrating = false;
    setIsHydrated(true);
    
    const init = async () => {
      if (window.location.href.includes("?oauth_state_id=")) {
        dispatch({
          type: "SET_STATE",
          state: {
            linkToken: localStorage.getItem("link_token"),
          },
        });
        return;
      }
      await generateToken();
    };
    void init();
  }, [dispatch, generateToken]);

	return (
		<main className="container flex h-full min-h-[400px] px-0 pb-12 md:px-8">
			<div className="grid w-full grid-cols-4 bg-muted pl-2 md:container md:rounded-3xl md:pr-0">
				<div className="relative col-span-1">
          <p>ACCOUNTS</p>
				</div>
				<div className="relative col-span-3 bg-accent md:rounded-r-3xl">
					<Outlet />
          {isHydrated ? <Link /> : ''}
				</div>
			</div>
		</main>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the username "{params.username}" exists</p>
				),
			}}
		/>
	)
}

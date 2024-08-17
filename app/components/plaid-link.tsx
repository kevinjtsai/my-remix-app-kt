/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useEffect, useContext } from "react";
import { usePlaidLink } from "react-plaid-link";

import { Button } from './ui/button.tsx';

import Context from "../utils/plaid-provider.tsx";

const Link = () => {
  console.log("link is called");
  const { linkToken, products, dispatch } = useContext(Context);
  console.log(`Context: ${Context}`)
  console.log(`useContext(Context): ${useContext(Context)}`)
  console.log(`products: ${products}`)
  console.log(`dispatch: ${dispatch}`)

  console.log(`linkToken: ${linkToken}`)

  const onSuccess = React.useCallback(
    (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        const response = await fetch("/set_access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: `public_token=${public_token}`,
        });
        if (!response.ok) {
          dispatch({
            type: "SET_STATE",
            state: {
              itemId: `no item_id retrieved`,
              accessToken: `no access_token retrieved`,
              isItemAccess: false,
            },
          });
          return;
        }
        interface Item {
          item_id: string,
          access_token: string,
        }
        const isItem = (object: unknown): object is Item => {
          return !!object && typeof object === 'object' && typeof ((object as Record<string, unknown>)['item_id']) === 'string'
        }
        const data  = await response.json();
        if (isItem(data)) {
          dispatch({
            type: "SET_STATE",
            state: {
              itemId: data.item_id,
              accessToken: data.access_token,
              isItemAccess: true,
            },
          });
        }
      };

      exchangePublicTokenForAccessToken();

      dispatch({ type: "SET_STATE", state: { linkSuccess: true } });
      window.history.pushState("", "", "/");
    },
    [dispatch]
  );

  let isOauth = false;
  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken!,
    onSuccess,
  };

  if (window.location.href.includes("?oauth_state_id=")) {
    // TODO: figure out how to delete this ts-ignore
    // @ts-ignore
    config.receivedRedirectUri = window.location.href;
    isOauth = true;
  }

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    console.log(`ready: ${ready}`)
    if (isOauth && ready) {
      open();
    }
  }, [ready, open, isOauth]);

  return (
    <Button type="button" onClick={() => open()} disabled={!ready}>
      Launch Link
    </Button>
  );
};

Link.displayName = "Link";

export default Link;
import { 
  createContext, 
  useReducer, 
  type Dispatch, 
  type ReactNode 
} from "react";

interface QuickstartState {
  linkSuccess: boolean;
  isItemAccess: boolean;
  isPaymentInitiation: boolean;
  linkToken: string | null;
  accessToken: string | null;
  itemId: string | null;
  isError: boolean;
  backend: boolean;
  products: string[];
  linkTokenError: {
    error_message: string;
    error_code: string;
    error_type: string;
  };
}

const initialState: QuickstartState = {
  linkSuccess: false,
  isItemAccess: true,
  isPaymentInitiation: false,
  linkToken: "", // Don't set to null or error message will show up briefly when site loads
  accessToken: null,
  itemId: null,
  isError: false,
  backend: true,
  products: ["transactions"],
  linkTokenError: {
    error_type: "",
    error_code: "",
    error_message: "",
  },
};

type QuickstartAction = {
  type: "SET_STATE";
  state: Partial<QuickstartState>;
};

interface QuickstartContext extends QuickstartState {
  dispatch: Dispatch<QuickstartAction>;
}

const Context = createContext<QuickstartContext>(
  initialState as QuickstartContext
);

const { Provider } = Context;
export const PlaidProvider: React.FC<{ children: ReactNode }> = (
  props
) => {
  const reducer = (
    state: QuickstartState,
    action: QuickstartAction
  ): QuickstartState => {
    switch (action.type) {
      case "SET_STATE":
        return { ...state, ...action.state };
      default:
        return { ...state };
    }
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  console.log(`plaid-provider dispatch: ${dispatch}`)
  return <Provider value={{ ...state, dispatch }}>{props.children}</Provider>;
};

export default Context;
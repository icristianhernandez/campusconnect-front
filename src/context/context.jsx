import { createContext, useReducer } from "react";
import initialState from "../reducer/initialState";
import { reducer } from "../reducer/reducer";

export const MyContext = createContext();

export function MyProvider({ children }) {
	const [appState, dispatch] = useReducer(reducer, initialState);

	const providerState = {
		appState,
		dispatch,
	};

	return (
		<MyContext.Provider value={providerState}>{children}</MyContext.Provider>
	);
}

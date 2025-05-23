// src/reducer/actionTypes.jsx

// Action Types

export const ADD_POST = "ADD_POST";

const actionTypes = {
	ADD_POST: "ADD_POST",
	LOGIN_REQUEST: "LOGIN_REQUEST",
	LOGIN_SUCCESS: "LOGIN_SUCCESS",
	LOGIN_FAILURE: "LOGIN_FAILURE",

	LOGOUT: "LOGOUT",

	FETCH_POSTS_REQUEST: "FETCH_POSTS_REQUEST",
	FETCH_POSTS_SUCCESS: "FETCH_POSTS_SUCCESS",
	FETCH_POSTS_FAILURE: "FETCH_POSTS_FAILURE",

	CREATE_POST_REQUEST: "CREATE_POST_REQUEST",
	CREATE_POST_SUCCESS: "CREATE_POST_SUCCESS",
	CREATE_POST_FAILURE: "CREATE_POST_FAILURE",

	DELETE_POST_REQUEST: "DELETE_POST_REQUEST",
	DELETE_POST_SUCCESS: "DELETE_POST_SUCCESS",
	DELETE_POST_FAILURE: "DELETE_POST_FAILURE",
};

export default actionTypes;

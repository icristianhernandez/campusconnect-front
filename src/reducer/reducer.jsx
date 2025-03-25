import actionTypes from './actionTypes';

export function reducer(state, action) {
    switch (action.type) {
        case actionTypes.ADD_POST:
            return {
                ...state,
                posts: [...state.posts, action.payload],
            };
        case 'SET_POSTS':
            return {
                ...state,
                posts: action.payload,
            };
        // Otros casos pueden ser añadidos aquí
        default:
            return state;
    }
};
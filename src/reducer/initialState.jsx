// initialState.jsx

// Estado inicial para la aplicación de red social
const initialState = {
	// Información del usuario
	isLoggedIn: false, // Indica si el usuario está logueado o no
	userId: null, // ID del usuario
	userType: "", // Tipo de usuario (ej. admin, usuario regular)
	username: "", // Nombre de usuario
	firstName: "", // Nombre del usuario
	lastName: "", // Apellido del usuario
	lastInteractionTime: null, // Hora de la última interacción del usuario

	// Información de los posts
	posts: [], // Lista de posts cargados

	// Información adicional que podría ser útil
	notifications: [], // Lista de notificaciones del usuario
	friends: [], // Lista de amigos del usuario
	messages: [], // Lista de mensajes del usuario
};

export default initialState;

import React, { useContext, useEffect, useState, useRef } from "react"; // Importa el hook useContext y useEffect
import "./Feed.css"; // Importa estilos CSS del archivo feed.css
import Post from "./Post"; //componente para post individual
import NewPostForm from "./NewPostForm"; //componente para formulario de nuevo post
import { MyContext } from "../../context/context"; // Importa el contexto global para manejar el estado de la app
import { supabase } from "../../utils/supabase"; //supabase para interactuar con la db
import { useNavigate } from "react-router-dom"; // For redirecting to register

function Feed() {
	const { appState, dispatch } = useContext(MyContext); // Obtiene el estado global y la funcion para actualizarlo (el dispatch)
	const { posts } = appState; //publicaciones almacenadas en estado global
	const [errorMessage, setErrorMessage] = useState(null); // para mostrar errores
	const [showNewPostForm, setShowNewPostForm] = useState(false); // Estado para controlar la visibilidad del formulario
	const [userProfiles, setUserProfiles] = useState({}); // State to store user profiles
	const [currentUser, setCurrentUser] = useState(null); // State to store the current user
	const [isAuthenticated, setIsAuthenticated] = useState(false); // State to track if user is authenticated
	const navigate = useNavigate();

	const feedTopRef = useRef(null);

	const setPosts = (updatedPosts) => {
		dispatch({ type: "SET_POSTS", payload: updatedPosts }); //actualiza la lista de posts
	};

	// Fetch the current user
	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const { data: { user }, error } = await supabase.auth.getUser();
				
				if (error) throw error;
				
				if (user) {
					setIsAuthenticated(true);
					const { data: userProfile, error: profileError } = await supabase
						.from("profiles")
						.select("*")
						.eq("id", user.id)
						.single();
					
					if (profileError) throw profileError;
					
					setCurrentUser(userProfile);
				} else {
					setIsAuthenticated(false);
				}
			} catch (error) {
				console.error("Error fetching current user:", error.message);
				setIsAuthenticated(false);
			}
		};
		
		fetchCurrentUser();
	}, []);

	// Redirect to register page
	const handleRegisterClick = () => {
		navigate("/");
	};

	// Render the component
	return (
		<div className="Feed">
			<div className="feed-container">
				<div className="left-column">
					{!isAuthenticated ? (
						<button 
							className="register-button" 
							onClick={handleRegisterClick}
						>
							<img src="Símbolo.png" alt="Register" />
							<span>Registrarse</span>
						</button>
					) : (
						// Authenticated user sidebar
						<>
							<button className="profile-button">
								<div className="profile-image-container">
									<img 
										src="/default_pfp.png" 
										alt="Profile" 
										className="profile-image"
										onError={(e) => {
											e.target.onerror = null;
											e.target.src = "/default_pfp.png";
										}}
									/>
								</div>
								<span>{currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : "Cargando..."}</span>
							</button>
							<button className="settings-button">
								<img src="Configuración.svg" alt="Configuración" />
								<span>Cambiar foto de perfil</span>
							</button>
						</>
					)}
				</div>
				<div className="middle-column">
					{/* Add ref to the top */}
					<div ref={feedTopRef}></div>
					<button
						className="create-post-button"
						onClick={() => setShowNewPostForm(true)}
					>
						Crear
					</button>
					{showNewPostForm && <NewPostForm />}{" "}
					{/* Mostrar formulario solo si está habilitado */}
					{errorMessage && <p className="error-message">{errorMessage}</p>}{" "}
					{/* Muestra errores */}
					<div className="posts-container">
						{posts &&
							posts.map((post) => (
								<Post
									key={post.post_id}
									post={post}
									posts={posts}
									setPosts={setPosts}
								/>
							))}
					</div>
				</div>
				<div className="right-column">
					{/* Contenido adicional para la columna derecha */}
				</div>
			</div>
		</div>
	);
}

export default Feed;

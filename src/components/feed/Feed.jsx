import React, { useContext, useEffect, useState, useRef } from "react"; // Importa el hook useContext y useEffect
import "./Feed.css"; // Importa estilos CSS del archivo feed.css
import Post from "./Post"; //componente para post individual
import NewPostForm from "./NewPostForm"; //componente para formulario de nuevo post
import { MyContext } from "../../context/context"; // Importa el contexto global para manejar el estado de la app
import { supabase } from "../../utils/supabase"; //supabase para interactuar con la db

function Feed() {
	const { appState, dispatch } = useContext(MyContext); // Obtiene el estado global y la funcion para actualizarlo (el dispatch)
	const { posts } = appState; //publicaciones almacenadas en estado global
	const [errorMessage, setErrorMessage] = useState(null); // para mostrar errores
	const [showNewPostForm, setShowNewPostForm] = useState(false); // Estado para controlar la visibilidad del formulario

	const feedTopRef = useRef(null);

	const setPosts = (updatedPosts) => {
		dispatch({ type: "SET_POSTS", payload: updatedPosts }); //actualiza la lista de posts
	};

	const fetchPostsWithComments = async () => {
		setErrorMessage(null);
		try {
			// Fetch posts with multimedia and likes
			const { data: postsData, error: postsError } = await supabase
				.from("posts")
				.select(`
					*,
					post_multimedia (
						media_type,
						multimedia_url
					),
					post_likes (
						like_id,
						user_id
					)
				`)
				.order("created_at", { ascending: false });

			if (postsError) throw postsError;

			// Fetch comments with multimedia and likes
			const { data: commentsData, error: commentsError } = await supabase
				.from("comments")
				.select(`
					*,
					comments_multimedia (
						media_type,
						multimedia_url
					),
					comments_likes (
						like_id,
						user_id
					)
				`)
				.order("created_at", { ascending: false });

			if (commentsError) throw commentsError;

			// Fetch user profiles
			const { data: profilesData, error: profilesError } = await supabase
				.from("profiles")
				.select("id, first_name, last_name");

			if (profilesError) throw profilesError;

			
			const profilesMap = profilesData.reduce((map, profile) => {
				map[profile.id] = `${profile.first_name} ${profile.last_name}`;
				return map;
			}, {});

			// Organize comments hierarchically
			const organizeComments = (comments, parentId = null) => {
				return comments
					.filter((comment) => comment.parent_comment_id === parentId)
					.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
					.map((comment) => ({
						...comment,
						username: profilesMap[comment.user_id] || "Usuario desconocido",
						multimedia: comment.comments_multimedia || [],
						likes: comment.comments_likes || [],
						replies: organizeComments(comments, comment.comment_id),
					}));
			};

		
			const combinedPosts = postsData.map((post) => ({
				...post,
				username: profilesMap[post.user_id] || "Usuario desconocido",
				multimedia: post.post_multimedia || [],
				likes: post.post_likes || [],
				comments: organizeComments(
					commentsData.filter(
						(comment) => comment.parent_post_id === post.post_id,
					),
				),
			}));

			setPosts(combinedPosts);
		} catch (error) {
			console.error("Error al obtener posts y comentarios:", error.message);
			setErrorMessage(
				"Hubo un error al cargar los posts y comentarios. Por favor, intente nuevamente.",
			);
		}
	};

	useEffect(() => {
		//hook para cargar posts y comentarios desde la db
		fetchPostsWithComments();
	}, []);

	const handleCreateButtonClick = () => {
		setShowNewPostForm(true);

		// Scroll to the top where the form is located
		window.scrollTo({ top: 0, behavior: "smooth" });

		// Alternative approach using ref if window.scrollTo doesn't work well
		if (feedTopRef.current) {
			feedTopRef.current.scrollIntoView({ behavior: "smooth" });
		}
	};

	// y esta parte es del renderizado del componente
	return (
		<div className="Feed">
			<div className="feed-container">
				<div className="left-column">
					<button className="profile-button">
						<div className="profile-placeholder"></div>
						<span>Perfil</span>
					</button>
					<button className="settings-button">
						<img src="Configuración.svg" alt="Configuración" />
						<span>Configuración</span>
					</button>
					{/* Contenido adicional para la columna izquierda */}
				</div>
				<div className="middle-column">
					{/* Add ref to the top */}
					<div ref={feedTopRef}></div>
					<button
						className="create-post-button"
						onClick={handleCreateButtonClick}
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

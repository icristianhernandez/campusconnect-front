import { useState, useContext, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import { MyContext } from "../../context/context";
import actionTypes from "../../reducer/actionTypes";

function NewPostForm() {
	const [newPostContent, setNewPostContent] = useState("");
	const [newPostMedia, setNewPostMedia] = useState(null);
	const [newPostMediaPreview, setNewPostMediaPreview] = useState(null);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState(null); // p mostrar errores
	const [userProfile, setUserProfile] = useState(null); // para almacenar el perfil del usuario autenticado
	const { dispatch } = useContext(MyContext);

	useEffect(() => {
		const fetchUserProfile = async () => {
			try {
				const { data: { user }, error: userError } = await supabase.auth.getUser();
				if (userError || !user) throw new Error("Usuario no autenticado.");
				const { data, error } = await supabase
					.from("profiles")
					.select("*")
					.eq("id", user.id)
					.single();
				
				if (error) throw error;
				setUserProfile(data);
			} catch (error) {
				console.error("Error al obtener el perfil de usuario:", error.message);
			}
		};
		
		fetchUserProfile();
	}, []);

	const handlePostSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setErrorMessage(null);

		try {
			// se obtiene el usuario autenticado
			const { data: user, error: userError } = await supabase.auth.getUser();
			if (userError || !user) throw new Error("Usuario no autenticado.");

			// se inserta el post en la tabla "posts" de supabase
			const { data: post, error: postError } = await supabase
				.from("posts")
				.insert({
					post_text: newPostContent,
					user_id: user.id, // ID del usuario autenticado
				})
				.select()
				.single();

			if (postError) throw postError;

			let multimedia = [];
			// si hay multimedia, se sube y asocio al post
			if (newPostMedia) {
				const fileName = `${post.post_id}-${newPostMedia.name}`;
				const { error: storageError } = await supabase.storage
					.from("nosepost") // FALTA EL BUCKEEEEET
					.upload(fileName, newPostMedia);

				if (storageError) throw storageError;

				const { publicURL, error: urlError } = supabase.storage
					.from("nosepost") //BUCKEEEEEEEEET
					.getPublicUrl(fileName);

				if (urlError) throw urlError;

				const { error: multimediaError } = await supabase
					.from("post_multimedia")
					.insert({
						post_id: post.post_id,
						media_type: newPostMedia.type.startsWith("video/")
							? "video"
							: "image",
						multimedia_url: publicURL,
					});

				if (multimediaError) throw multimediaError;

				multimedia = [
					{
						media_type: newPostMedia.type.startsWith("video/")
							? "video"
							: "image",
						multimedia_url: publicURL,
					},
				];
			}

			// actualiza el estado global con el nuevo post
			dispatch({
				type: actionTypes.ADD_POST,
				payload: {
					...post,
					multimedia,
					user_profile: userProfile
				},
			});

			// se impia el formulario
			setNewPostContent("");
			setNewPostMedia(null);
			setNewPostMediaPreview(null);
		} catch (error) {
			console.error("Error al crear el post:", error.message);
			setErrorMessage(error.message); // muestra el error en la interfaz
		} finally {
			setLoading(false);
		}
	};

	const handleMediaChange = (e) => {
		const file = e.target.files[0];
		setNewPostMedia(file);
		setNewPostMediaPreview(URL.createObjectURL(file));
	};

	// se renderiza el formulario
	return (
		<form onSubmit={handlePostSubmit} className="new-post-form NewPostForm">
			<textarea
				value={newPostContent}
				onChange={(e) => setNewPostContent(e.target.value)}
				placeholder="¿Qué estás pensando?"
				className="new-post-input"
				required
			/>
			{newPostMediaPreview &&
				(newPostMedia.type.startsWith("video/") ? (
					<video controls className="media-preview">
						<source src={newPostMediaPreview} type={newPostMedia.type} />
					</video>
				) : (
					<img
						src={newPostMediaPreview}
						alt="Preview"
						className="media-preview"
					/>
				))}
			<div className="new-post-actions">
				<label className="new-post-media-label">
					Adjuntar archivo
					<input
						type="file"
						accept="image/*,video/*"
						onChange={handleMediaChange}
						className="new-post-media-input"
					/>
				</label>
				<button
					type="submit"
					className={`new-post-submit ${newPostContent || newPostMedia ? "" : "disabled"}`}
					disabled={(!newPostContent && !newPostMedia) || loading}
				>
					{loading ? "Publicando..." : "Publicar"}
				</button>
			</div>
			{errorMessage && <p className="error-message">{errorMessage}</p>}{" "}
			{/* Muestra errores */}
		</form>
	);
}

export default NewPostForm;

import { useState, useContext, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabase";
import { MyContext } from "../../context/context";
import actionTypes from "../../reducer/actionTypes";
import "./NewPostForm.css";

function NewPostForm({ adminStatus, adminLevel }) {
	const [newPostContent, setNewPostContent] = useState("");
	const [newPostMedia, setNewPostMedia] = useState(null);
	const [newPostMediaPreview, setNewPostMediaPreview] = useState(null);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState(null); 
	const [userProfile, setUserProfile] = useState(null);
	const [tags, setTags] = useState([]);
	const [showTagsDropdown, setShowTagsDropdown] = useState(false);
	const [selectedTags, setSelectedTags] = useState([]);
	const [tagError, setTagError] = useState(null);
	const { dispatch } = useContext(MyContext);
	const tagsDropdownRef = useRef(null);

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
		fetchTags();
	}, []);

	useEffect(() => {
		// Close dropdown when clicking outside
		const handleClickOutside = (event) => {
			if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
				setShowTagsDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const fetchTags = async () => {
		try {
			const { data, error } = await supabase
				.from("tags")
				.select("*")
				.order("tag_name");
			
			if (error) throw error;
			setTags(data || []);
		} catch (error) {
			console.error("Error al obtener los tags:", error.message);
		}
	};

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

			// Insert tags associations for the post
			if (selectedTags.length > 0) {
				const tagAssociations = selectedTags.map(tagId => ({
					post_id: post.post_id,
					tag_id: tagId
				}));

				const { error: tagError } = await supabase
					.from("post_tags")
					.insert(tagAssociations);

				if (tagError) throw tagError;
			}

			// actualiza el estado global con el nuevo post
			dispatch({
				type: actionTypes.ADD_POST,
				payload: {
					...post,
					multimedia,
					user_profile: userProfile,
					tags: selectedTags.map(tagId => 
						tags.find(tag => tag.id === tagId)
					)
				},
			});

			// se impia el formulario
			setNewPostContent("");
			setNewPostMedia(null);
			setNewPostMediaPreview(null);
			setSelectedTags([]);
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

	const toggleTagSelection = (tagId) => {
		// Check if this is the "anuncio" tag
		const selectedTag = tags.find(tag => tag.id === tagId);
		
		if (selectedTag && selectedTag.tag_name.toLowerCase() === "anuncio") {
			// Only admins can use the "anuncio" tag
			if (!adminStatus || adminLevel !== 1) {
				setTagError("Solo los administradores pueden usar el tag 'anuncio'");
				return;
			}
		}
		
		setTagError(null); // Clear any previous error
		
		setSelectedTags(prevSelectedTags => {
			if (prevSelectedTags.includes(tagId)) {
				return prevSelectedTags.filter(id => id !== tagId);
			} else {
				return [...prevSelectedTags, tagId];
			}
		});
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
			
			{/* Display selected tags */}
			{selectedTags.length > 0 && (
				<div className="selected-tags-container">
					{selectedTags.map(tagId => {
						const tag = tags.find(t => t.id === tagId);
						return tag && (
							<span key={tag.id} className="selected-tag">
								{tag.tag_name}
								<button 
									type="button" 
									className="remove-tag-btn"
									onClick={() => toggleTagSelection(tag.id)}
								>
									×
								</button>
							</span>
						);
					})}
				</div>
			)}

			{tagError && <p className="tag-error">{tagError}</p>}
			
			<div className="new-post-actions">
				<div className="tags-dropdown-container" ref={tagsDropdownRef}>
					<button 
						type="button" 
						className="tags-dropdown-button"
						onClick={() => setShowTagsDropdown(!showTagsDropdown)}
					>
						Tags ▼
					</button>
					{showTagsDropdown && (
						<div className="tags-dropdown-menu">
							{tags.length > 0 ? (
								tags.map(tag => (
									<div 
										key={tag.id} 
										className={`tag-option ${selectedTags.includes(tag.id) ? 'selected' : ''} ${tag.tag_name.toLowerCase() === "anuncio" && !adminStatus ? 'admin-only' : ''}`}
										onClick={() => toggleTagSelection(tag.id)}
									>
										<span className="tag-name">{tag.tag_name}</span>
										{tag.tag_name.toLowerCase() === "anuncio" && !adminStatus && <span className="admin-only-indicator">Solo admin</span>}
										{selectedTags.includes(tag.id) && (
											<span className="tag-selected-indicator">✓</span>
										)}
									</div>
								))
							) : (
								<div className="no-tags-message">No hay tags disponibles</div>
							)}
						</div>
					)}
				</div>
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
					disabled={(!newPostContent && !newPostMedia) || loading || tagError}
				>
					{loading ? "Publicando..." : "Publicar"}
				</button>
			</div>
			{errorMessage && <p className="error-message">{errorMessage}</p>}
		</form>
	);
}

export default NewPostForm;

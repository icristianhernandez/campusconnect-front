import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./Post.css";
import Comment from "./Comment";
import { supabase } from "../../utils/supabase";

function Post({ post, setPosts, posts, isAdmin }) {
	const [newCommentContent, setNewCommentContent] = useState(""); // almacena el texto de un nuevo comentario
	const [newCommentMedia, setNewCommentMedia] = useState(null); //archivo junto al comentario
	const [newCommentMediaPreview, setNewCommentMediaPreview] = useState(null); // para la vista previa del mulmedia
	const [editing, setEditing] = useState(false); // indica si se esta en el modo edicion
	const [editedContent, setEditedContent] = useState(post.content); // contenido editado
	const [showOptions, setShowOptions] = useState(false); // visibilidad de las opciones de edicion y eliminacion
	const [likes, setLikes] = useState(post.likes || []); // Ensure likes is always an array
	const [userId, setUserId] = useState(null); // almacenar el ID del usuario autenticado
	const [showConfirmDelete, setShowConfirmDelete] = useState(false);
	const [deleteError, setDeleteError] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const modalRef = useRef(null);
	const [postTags, setPostTags] = useState(post.tags || []);

	// Add state for mobile view
	const [showMobileComments, setShowMobileComments] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Check for mobile view on mount and window resize
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Toggle comments visibility on mobile
	const toggleMobileComments = () => {
		setShowMobileComments(!showMobileComments);
	};

	// Close mobile comments
	const closeMobileComments = () => {
		setShowMobileComments(false);
	};

	// Update body class to prevent scrolling when comments are open
	useEffect(() => {
		if (isMobile && showMobileComments) {
			document.body.classList.add('comments-open');
		} else {
			document.body.classList.remove('comments-open');
		}

		return () => {
			document.body.classList.remove('comments-open');
		};
	}, [isMobile, showMobileComments]);

	useEffect(() => {
		const fetchUser = async () => {
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser();
			if (!error && user) {
				setUserId(user.id); // se almacena el ID del usuario autenticado
			}
		};
		fetchUser();
	}, []);

	const handleCommentChange = (value) => {
		setNewCommentContent(value);
	}; // actualiza el estado de newCommentContent

	const handleCommentMediaChange = (e) => {
		const file = e.target.files[0];
		setNewCommentMedia(file);
		setNewCommentMediaPreview(URL.createObjectURL(file));
	}; // actualiza el estado de newCommentMedia y newCommentMediaPreview

	const handleCommentSubmit = async (e) => {
		e.preventDefault();

		try {
			// se obtiene el usuario autenticado desde la db de supabase
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			if (userError || !user) {
				throw new Error("Usuario no autenticado. Por favor, inicia sesión.");
			}

			 // Fetch the user's profile to attach to the new comment
			 const { data: userProfile, error: profileError } = await supabase
			 .from("profiles")
			 .select("*")
			 .eq("id", user.id)
			 .single();
			 
		 if (profileError) throw profileError;

			// se inserta el comentario en la tabla "comments"
			const { data: newComment, error: commentError } = await supabase
				.from("comments")
				.insert({
					comment_text: newCommentContent,
					parent_post_id: post.post_id,
					user_id: user.id, // ID del usuario autenticado
				})
				.select()
				.single();

			if (commentError) throw commentError;

			let multimedia = [];
			// si hay multimedia, se sube y asocia al comentario
			if (newCommentMedia) {
				const fileName = `${newComment.comment_id}-${newCommentMedia.name}`;
				const { error: storageError } = await supabase.storage
					.from("nose") // FALTA EL BUCKET ACA
					.upload(fileName, newCommentMedia);

				if (storageError) throw storageError;

				const {
					data: { publicUrl },
					error: urlError,
				} = supabase.storage
					.from("nose") // FALTA EL BUCKET ACA TAMBIEN
					.getPublicUrl(fileName);

				if (urlError) throw urlError;

				const { error: multimediaError } = await supabase
					.from("comments_multimedia")
					.insert({
						comment_id: newComment.comment_id,
						media_type: newCommentMedia.type.startsWith("video/")
							? "video"
							: "image",
						multimedia_url: publicUrl,
					});

				if (multimediaError) throw multimediaError;

				multimedia = [
					{
						media_type: newCommentMedia.type.startsWith("video/")
							? "video"
							: "image",
						multimedia_url: publicUrl,
					},
				];
			}

			// se actualiza el estado local con el nuevo comentario
			const updatedPosts = posts.map((p) => {
				if (p.post_id === post.post_id) {
					return {
						...p,
						comments: [
							...(p.comments || []),
							{
								...newComment,
								comment_text: newCommentContent,
								multimedia,
								// Add the user profile to the new comment
								user_profile: userProfile
							},
						],
					};
				}
				return p;
			});
			setPosts(updatedPosts);

			// se limpia el formulario
			setNewCommentContent("");
			setNewCommentMedia(null);
			setNewCommentMediaPreview(null);
		} catch (error) {
			console.error("Error al crear el comentario:", error.message);
			alert(error.message); // manejor de errores
		}
	};

	const handleEditPost = () => {
		setEditedContent(post.post_text); // aca inicializo el contenido editado con el texto actual del post
		setEditing(true);
		setShowOptions(false);
	};

	const handleSaveEdit = async () => {
		try {
			// actualiza el post en la base de datos
			const { error } = await supabase
				.from("posts")
				.update({ post_text: editedContent })
				.eq("post_id", post.post_id);

			if (error) throw error;

			// actualiza el estado local con el post editado
			const updatedPosts = posts.map((p) => {
				if (p.post_id === post.post_id) {
					return { ...p, post_text: editedContent };
				}
				return p;
			});
			setPosts(updatedPosts);
			setEditing(false);
		} catch (err) {
			console.error("Error al actualizar el post:", err.message);
			alert("Hubo un error al actualizar el post. Intente nuevamente.");
		}
	};

	const handleDeletePost = async () => {
		setDeleteLoading(true);
		setDeleteError(null);

		try {
			 // Check if the post has comments
			 const { data: commentCount, error: countError } = await supabase
			 .from("comments")
			 .select("comment_id", { count: "exact" })
			 .eq("parent_post_id", post.post_id);
			
			 if (countError) throw countError;
			
			 // First delete associated multimedia
			 if (post.multimedia && post.multimedia.length > 0) {
			   const { error: multiError } = await supabase
				 .from("post_multimedia")
				 .delete()
				 .eq("post_id", post.post_id);
			   
			   if (multiError) throw multiError;
			 }
			
			 // Delete tags associations
			 const { error: tagError } = await supabase
			   .from("post_tags")
			   .delete()
			   .eq("post_id", post.post_id);
			
			 if (tagError) throw tagError;
			
			 // Delete likes
			 const { error: likesError } = await supabase
			   .from("post_likes")
			   .delete()
			   .eq("post_id", post.post_id);
			
			 if (likesError) throw likesError;
			
			 // Delete comments and their multimedia/likes
			 if (post.comments && post.comments.length > 0) {
			   // First get all comment IDs to handle their multimedia and likes
			   const commentIds = post.comments.map(c => c.comment_id);
			   
			   // Delete comment multimedia
			   const { error: commMediaError } = await supabase
				 .from("comments_multimedia")
				 .delete()
				 .in("comment_id", commentIds);
			   
			   if (commMediaError) throw commMediaError;
			   
			   // Delete comment likes
			   const { error: commLikesError } = await supabase
				 .from("comments_likes")
				 .delete()
				 .in("comment_id", commentIds);
			   
			   if (commLikesError) throw commLikesError;
			   
			   // Now delete all comments
			   const { error: commentsError } = await supabase
				 .from("comments")
				 .delete()
				 .eq("parent_post_id", post.post_id);
			   
			   if (commentsError) throw commentsError;
			 }
			
			 // Finally delete the post
			 const { error } = await supabase
			   .from("posts")
			   .delete()
			   .eq("post_id", post.post_id);
		
			 if (error) throw error;
		
			 // Update local state
			 const updatedPosts = posts.filter((p) => p.post_id !== post.post_id);
			 setPosts(updatedPosts);
			 setShowConfirmDelete(false);
		   } catch (err) {
			 console.error("Error al eliminar el post:", err.message);
			 setDeleteError("Hubo un error al eliminar el post. Intente nuevamente.");
		   } finally {
			 setDeleteLoading(false);
		   }
		 };
		
		 // Completely revamp the delete confirmation modal
		 const DeleteConfirmationModal = () => {
		   if (!showConfirmDelete) return null;
		
		   return createPortal(
			 <div 
			   className="modal-backdrop" 
			   onClick={(e) => {
				 e.stopPropagation();
				 if (!deleteLoading) {
				   setShowConfirmDelete(false);
				 }
			   }}
			 >
			   <div 
				 className="modal-content" 
				 onClick={(e) => e.stopPropagation()} 
				 ref={modalRef}
			   >
				 <h3>Eliminar publicación</h3>
				 <p>
				   ¿Estás seguro de que deseas eliminar esta publicación? Esta acción
				   no se puede deshacer.
				 </p>
				 
				 {deleteError && <div className="delete-error">{deleteError}</div>}
				 
				 <div className="confirmation-buttons">
				   <button
					 className="cancel-button"
					 onClick={(e) => {
					   e.stopPropagation();
					   setShowConfirmDelete(false);
					 }}
					 disabled={deleteLoading}
				   >
					 Cancelar
				   </button>
				   <button
					 className="confirm-button"
					 onClick={(e) => {
					   e.stopPropagation();
					   handleDeletePost();
					 }}
					 disabled={deleteLoading}
				   >
					 {deleteLoading ? "Eliminando..." : "Eliminar"}
				   </button>
				 </div>
			   </div>
			 </div>,
			 document.body
		   );
		 };

	const togglePostOptions = (e) => {
		e.stopPropagation();
		setShowOptions(!showOptions);
	};

	useEffect(() => {
		if (showOptions) {
			const handleClickOutside = () => {
				setShowOptions(false);
			};

			document.addEventListener("click", handleClickOutside);
			return () => {
				document.removeEventListener("click", handleClickOutside);
			};
		}
	}, [showOptions]);

	const handleLike = async () => {
		try {
			const existingLike = likes.find((like) => like.user_id === userId);
			if (existingLike) {
				// Eliminar el like
				const { error } = await supabase
					.from("post_likes")
					.delete()
					.eq("like_id", existingLike.like_id);

				if (error) throw error;

				// Actualizar el estado local
				setLikes(likes.filter((like) => like.like_id !== existingLike.like_id));
			} else {
				// Crear un nuevo like
				const { data, error } = await supabase
					.from("post_likes")
					.insert({ user_id: userId, post_id: post.post_id })
					.select()
					.single();

				if (error) throw error;

				// Actualizar el estado local
				setLikes([...likes, data]);
			}
		} catch (error) {
			console.error("Error al manejar el like:", error.message);
		}
	};

	// a partir de aca se renderiza el componente con la nueva estructura de 4 secciones
	return (
		<div className={`post ${showMobileComments ? 'expanded' : ''}`}>
			<div className="post-top-section">
				{/* Sección superior izquierda - contenido del post */}
				<div className="post-content">
					 {/* Updated user profile section with default profile picture */}
					<div className="post-user-profile">
						<div className="post-user-avatar">
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
						<div className="post-user-info">
							<p>{post.user_profile ? `${post.user_profile.first_name} ${post.user_profile.last_name}` : "Usuario desconocido"}</p>
							<span>{new Date(post.created_at).toLocaleString()}</span>
						</div>
					</div>

					{editing ? (
						<textarea
							value={editedContent}
							onChange={(e) => setEditedContent(e.target.value)}
							className="edit-post-input"
						/>
					) : (
						<p className="post-text">{post.post_text}</p> // Wrap post text in a paragraph with a class
					)}
					{post.multimedia &&
						post.multimedia.map((media) => (
							<div key={media.multimedia_id}>
								{media.media_type === "image" && (
									<img src={media.multimedia_url} alt="Post multimedia" />
								)}
								{media.media_type === "video" && (
									<video controls src={media.multimedia_url}></video>
								)}
							</div>
						))}
					<div className="post-actions">
						{editing && (
							<button className="save-edit-button" onClick={handleSaveEdit}>
								Guardar
							</button>
						)}
						{/* Like button moved to bottom section */}
					</div>

					 {/* Mobile post tags display */}
					 {isMobile && (
						<div className="mobile-post-tags">
							{postTags && postTags.length > 0 ? (
								postTags.map((tag, index) => (
									<span key={index} className="post-tag">
										{tag.tag_name}
									</span>
								))
							) : (
								<span className="post-tag general-tag">General</span>
							)}
						</div>
					)}

					{/* New post options UI that matches the comment options style */}
					{userId === post.user_id && (
						<div className="post-options-container">
							<button
								className="post-options-button"
								onClick={togglePostOptions}
								aria-label="Opciones de publicación"
							>
								•••
							</button>

							{showOptions && (
								<div className="post-options-dropdown">
									<button
										className="post-option-item"
										onClick={(e) => {
											e.stopPropagation();
											handleEditPost();
										}}
									>
										<span className="post-option-icon">✏️</span>
										<span>Editar</span>
									</button>
									<button
										className="post-option-item"
										onClick={(e) => {
											e.stopPropagation();
											setShowConfirmDelete(true);
										}}
									>
										<span className="post-option-icon">🗑️</span>
										<span>Eliminar</span>
									</button>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Sección superior derecha - lista de comentarios */}
				<div className={`post-comments-list ${showMobileComments ? 'visible' : ''}`}>
					<div className="comments-header">
						<h3>Comentarios</h3>
						{isMobile && (
							<button 
								className="close-comments-button"
								onClick={closeMobileComments}
								aria-label="Cerrar comentarios"
							>
								×
							</button>
						)}
					</div>
					<div className="comments-container">
						{post.comments && post.comments.length > 0 ? (
							post.comments.map((comment, index) => (
								<React.Fragment key={comment.comment_id}>
									<Comment
										comment={comment}
										post={post}
										setPosts={setPosts}
										posts={posts}
										isAdmin={isAdmin}
									/>
									{/* Add divider after each comment except the last one */}
									{index < post.comments.length - 1 && (
										<hr className="comment-divider" />
									)}
								</React.Fragment>
							))
						) : (
							<div className="no-comments-message">
								No hay comentarios. Sé el primero en comentar.
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="post-bottom-section">
				{/* Sección inferior izquierda - para funciones futuras */}
				<div className="post-functions">
					<div className="function-content">
						 {/* Desktop view: like button and tags in the same row */}
						 {!isMobile && (
							<div className="like-tags-container">
								<button
									className={`like-button ${Array.isArray(likes) && likes.some((like) => like.user_id === userId) ? "liked" : ""}`}
									onClick={handleLike}
								>
									<img
										src={
											Array.isArray(likes) &&
											likes.some((like) => like.user_id === userId)
												? "Corazón con relleno (1).svg"
												: "Corazón con contorno.svg"
										}
										alt="Like Icon"
										className="like-icon"
									/>
									<span className="likes-count">{likes.length}</span>
								</button>

								{/* Display post tags - now in same row as the like button */}
								<div className="post-tags-container">
									{postTags && postTags.length > 0 ? (
										postTags.map((tag, index) => (
											<span key={index} className="post-tag">
												{tag.tag_name}
											</span>
										))
									) : (
										<span className="post-tag general-tag">General</span>
									)}
								</div>
							</div>
						 )}

						 {/* Mobile view: action buttons */}
						 {isMobile && (
							<div className="mobile-post-actions">
								<button 
									className={`mobile-action-button ${Array.isArray(likes) && likes.some((like) => like.user_id === userId) ? "liked" : ""}`}
									onClick={handleLike}
								>
									<img
										src={
											Array.isArray(likes) &&
											likes.some((like) => like.user_id === userId)
												? "Corazón con relleno (1).svg"
												: "Corazón con contorno.svg"
										}
										alt="Like"
									/>
									<span>{likes.length}</span>
								</button>
								<button 
									className="mobile-action-button comments"
									onClick={toggleMobileComments}
								>
									<img 
										src="comment-icon.svg" 
										alt="Comments"
										onError={(e) => {
											e.target.onerror = null;
											e.target.src = "https://img.icons8.com/material-outlined/24/000000/comments.png";
										}}
									/>
									<span>{post.comments ? post.comments.length : 0}</span>
								</button>
							</div>
						 )}
					</div>
				</div>

				{/* Sección inferior derecha - formulario de comentarios */}
				<div className={`post-comment-form ${showMobileComments ? 'visible' : ''}`}>
					<form onSubmit={handleCommentSubmit} className="new-comment-form">
						<div className="comment-input-container">
							<textarea
								value={newCommentContent}
								onChange={(e) => handleCommentChange(e.target.value)}
								placeholder="Escribe un comentario..."
								className="new-comment-input"
								rows="1" /* Force single line display */
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										if (newCommentContent.trim() || newCommentMedia) {
											handleCommentSubmit(e);
										}
									}
								}}
							></textarea>
							<div className="comment-actions-group">
								<label className="new-comment-media-label">
									<img 
										src="Inicio-color.png" 
										alt="Adjuntar archivo"
										width="30"
										height="30"
									/>
									<input
										type="file"
										accept="image/*,video/*"
										onChange={handleCommentMediaChange}
										className="new-comment-media-input"
									/>
								</label>
								<button
									type="submit"
									className="new-comment-submit-icon"
									disabled={!newCommentContent && !newCommentMedia}
								>
									<img src="Enviar.svg" alt="Enviar" />
								</button>
							</div>
						</div>
						{newCommentMediaPreview &&
							(newCommentMedia.type.startsWith("video/") ? (
								<video controls className="media-preview">
									<source
										src={newCommentMediaPreview}
										type={newCommentMedia.type}
									/>
								</video>
							) : (
								<img
									src={newCommentMediaPreview}
									alt="Preview"
									className="media-preview"
								/>
							))}
						<div className="new-comment-actions">
							{/* Removed the attachment button from here as it's now next to the send button */}
						</div>
					</form>
				</div>
			</div>

			{/* Delete confirmation modal rendered through portal */}
			<DeleteConfirmationModal />
		</div>
	);
}

export default Post;

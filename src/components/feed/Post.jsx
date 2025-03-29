import React, { useState, useEffect } from 'react';
import './Post.css';
import Comment from './Comment';
import { supabase } from '../../utils/supabase';

function Post({ post, setPosts, posts }) {
    const [newCommentContent, setNewCommentContent] = useState(""); // almacena el texto de un nuevo comentario
    const [newCommentMedia, setNewCommentMedia] = useState(null); //archivo junto al comentario
    const [newCommentMediaPreview, setNewCommentMediaPreview] = useState(null); // para la vista previa del mulmedia
    const [editing, setEditing] = useState(false); // indica si se esta en el modo edicion
    const [editedContent, setEditedContent] = useState(post.content); // contenido editado
    const [showOptions, setShowOptions] = useState(false); // visibilidad de las opciones de edicion y eliminacion
    const [likes, setLikes] = useState(post.likes || []); // Ensure likes is always an array
    const [userId, setUserId] = useState(null); // almacenar el ID del usuario autenticado

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
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
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
            }

            // se inserta el comentario en la tabla "comments"
            const { data: newComment, error: commentError } = await supabase
                .from('comments')
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
                const { error: storageError } = await supabase
                    .storage
                    .from('nose') // FALTA EL BUCKET ACA
                    .upload(fileName, newCommentMedia);

                if (storageError) throw storageError;

                const { data: { publicUrl }, error: urlError } = supabase
                    .storage
                    .from('nose') // FALTA EL BUCKET ACA TAMBIEN
                    .getPublicUrl(fileName);

                if (urlError) throw urlError;

                const { error: multimediaError } = await supabase
                    .from('comments_multimedia')
                    .insert({
                        comment_id: newComment.comment_id,
                        media_type: newCommentMedia.type.startsWith('video/') ? 'video' : 'image',
                        multimedia_url: publicUrl,
                    });

                if (multimediaError) throw multimediaError;

                multimedia = [{
                    media_type: newCommentMedia.type.startsWith('video/') ? 'video' : 'image',
                    multimedia_url: publicUrl,
                }];
            }

            // se actualiza el estado local con el nuevo comentario
            const updatedPosts = posts.map(p => {
                if (p.post_id === post.post_id) {
                    return {
                        ...p,
                        comments: [...(p.comments || []), { 
                            ...newComment, 
                            comment_text: newCommentContent, 
                            multimedia 
                        }],
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
                .from('posts')
                .update({ post_text: editedContent })
                .eq('post_id', post.post_id);

            if (error) throw error;

            // actualiza el estado local con el post editado
            const updatedPosts = posts.map(p => {
                if (p.post_id === post.post_id) {
                    return { ...p, post_text: editedContent };
                }
                return p;
            });
            setPosts(updatedPosts);
            setEditing(false);
        } catch (err) {
            console.error('Error al actualizar el post:', err.message);
            alert('Hubo un error al actualizar el post. Intente nuevamente.');
        }
    };

    const handleDeletePost = async () => {
        try {
            // elimina el post de la base de datos
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('post_id', post.post_id);

            if (error) throw error;

            // se actualiza el estado local eliminando el post
            const updatedPosts = posts.filter(p => p.post_id !== post.post_id);
            setPosts(updatedPosts);
        } catch (err) {
            console.error('Error al eliminar el post:', err.message);
            alert('Hubo un error al eliminar el post. Intente nuevamente.');
        }
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
            
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [showOptions]);

    const handleLike = async () => {
        try {
            const existingLike = likes.find(like => like.user_id === userId);
            if (existingLike) {
                // Eliminar el like
                const { error } = await supabase
                    .from('post_likes')
                    .delete()
                    .eq('like_id', existingLike.like_id);

                if (error) throw error;

                // Actualizar el estado local
                setLikes(likes.filter(like => like.like_id !== existingLike.like_id));
            } else {
                // Crear un nuevo like
                const { data, error } = await supabase
                    .from('post_likes')
                    .insert({ user_id: userId, post_id: post.post_id })
                    .select()
                    .single();

                if (error) throw error;

                // Actualizar el estado local
                setLikes([...likes, data]);
            }
        } catch (error) {
            console.error('Error al manejar el like:', error.message);
        }
    };

    // a partir de aca se renderiza el componente con la nueva estructura de 4 secciones
    return (
        <div className="post">
            <div className="post-top-section">
                {/* Sección superior izquierda - contenido del post */}
                <div className="post-content">
                    {/* User profile section for future implementation */}
                    <div className="post-user-profile">
                        {/* Here you can add user photo, name and timestamp in the future */}
                        <div className="post-user-avatar-placeholder"></div>
                        <div className="post-user-info-placeholder">
                            <p>Username placeholder</p>
                            <span>Timestamp placeholder</span>
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
                    {post.multimedia && post.multimedia.map(media => (
                        <div key={media.multimedia_id}>
                            {media.media_type === 'image' && <img src={media.multimedia_url} alt="Post multimedia" />}
                            {media.media_type === 'video' && <video controls src={media.multimedia_url}></video>}
                        </div>
                    ))}
                    <div className="post-actions">
                        {editing && (
                            <button className="save-edit-button" onClick={handleSaveEdit}>
                                Guardar
                            </button>
                        )}
                        <button 
                            className={`like-button ${Array.isArray(likes) && likes.some(like => like.user_id === userId) ? 'liked' : ''}`} 
                            onClick={handleLike}
                        >
                            {Array.isArray(likes) && likes.some(like => like.user_id === userId) ? '❤️' : '🤍'} {likes.length}
                        </button>
                    </div>
                    
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
                                            handleDeletePost();
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
                <div className="post-comments-list">
                    <div className="comments-header">
                        <h3>Comentarios</h3>
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
                                    />
                                    {/* Add divider after each comment except the last one */}
                                    {index < post.comments.length - 1 && <hr className="comment-divider" />}
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
                    <div className="function-placeholder">
                        <p>Funciones adicionales se implementarán aquí</p>
                    </div>
                </div>
                
                {/* Sección inferior derecha - formulario de comentarios */}
                <div className="post-comment-form">
                    <form onSubmit={handleCommentSubmit} className="new-comment-form">
                        <div className="comment-input-container">
                            <textarea
                                value={newCommentContent}
                                onChange={(e) => handleCommentChange(e.target.value)}
                                placeholder="Escribe un comentario..."
                                className="new-comment-input"
                                rows="1" /* Force single line display */
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (newCommentContent.trim() || newCommentMedia) {
                                            handleCommentSubmit(e);
                                        }
                                    }
                                }}
                            ></textarea>
                            <div className="comment-actions-group">
                                <label className="new-comment-media-label">
                                    📎
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
                        {newCommentMediaPreview && (
                            newCommentMedia.type.startsWith('video/') ? (
                                <video controls className="media-preview">
                                    <source src={newCommentMediaPreview} type={newCommentMedia.type} />
                                </video>
                            ) : (
                                <img src={newCommentMediaPreview} alt="Preview" className="media-preview" />
                            )
                        )}
                        <div className="new-comment-actions">
                            {/* Removed the attachment button from here as it's now next to the send button */}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Post;

import React, { useState } from 'react';
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

    // a partir de aca se renderiza el componente y vainadesa
    return (
        <div className="post">
            <div className="post-content">
                {editing ? (
                    <textarea 
                        value={editedContent} 
                        onChange={(e) => setEditedContent(e.target.value)} 
                        className="edit-post-input"
                    />
                ) : (
                    post.post_text
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
                </div>
                <div className="post-options">
                    <button className="options-button" onClick={() => setShowOptions(!showOptions)}>⋮</button>
                    {showOptions && (
                        <div className="options-menu">
                            <button onClick={handleEditPost}>Editar</button>
                            <button onClick={handleDeletePost}>Eliminar</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="post-comments">
                {post.comments && post.comments.map((comment) => (
                    <Comment 
                        key={comment.comment_id} 
                        comment={comment} 
                        post={post} 
                        setPosts={setPosts} 
                        posts={posts} 
                    />
                ))}
                <form onSubmit={handleCommentSubmit} className="new-comment-form">
                    <input
                        type="text"
                        value={newCommentContent}
                        onChange={(e) => handleCommentChange(e.target.value)}
                        placeholder="Escribe un comentario..."
                        className="new-comment-input"
                    />
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
                        <label className="new-comment-media-label">
                            Adjuntar archivo
                            <input 
                                type="file" 
                                accept="image/*,video/*" 
                                onChange={handleCommentMediaChange} 
                                className="new-comment-media-input"
                            />
                        </label>
                        <button 
                            type="submit" 
                            className={`new-comment-submit ${newCommentContent || newCommentMedia ? '' : 'disabled'}`}
                            disabled={!newCommentContent && !newCommentMedia}
                        >
                            Comentar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Post;

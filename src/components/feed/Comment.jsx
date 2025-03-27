import React, { useState } from 'react';
import './Comment.css';
import { supabase } from '../../utils/supabase';

function Comment({ comment, post, setPosts, posts }) {
    const [expanded, setExpanded] = useState(false); // pa controlar si se expande el media
    const [editing, setEditing] = useState(false); // pa controlar si se está editando el comentario
    const [editedContent, setEditedContent] = useState(comment.comment_text); // pa guardar el contenido editado
    const [showOptions, setShowOptions] = useState(false); // pa mostrar las opciones de comentario

    const handleMediaClick = () => {
        setExpanded(!expanded);
    }; // esto simplemente alterna el estado de expanded del media

    const handleEditComment = () => { //para activar el modo de edición
        setEditing(true);
        setShowOptions(false);
    };

    const handleSaveEdit = async () => {
        try {
            // cctualiza el comentario en la base de datos
            const { error } = await supabase
                .from('comments')
                .update({ comment_text: editedContent }) // cambia el texto del comentario
                .eq('comment_id', comment.comment_id);

            if (error) throw error;

            // actualiza el estado local con el comentario editado
            const updatedPosts = posts.map(p => {
                if (p.post_id === post.post_id) {
                    return {
                        ...p,
                        comments: p.comments.map(c => 
                            c.comment_id === comment.comment_id 
                                ? { ...c, comment_text: editedContent } 
                                : c
                        ),
                    };
                }
                return p;
            });
            setPosts(updatedPosts);
            setEditing(false); // desactiva el modo de edición
        } catch (err) {
            console.error('Error al actualizar el comentario:', err.message);
            alert('Hubo un error al actualizar el comentario. Intente nuevamente.');
        }
    };

    const handleDeleteComment = async () => {
        try {
            // elimina el comentario de la base de datos
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('comment_id', comment.comment_id);

            if (error) throw error;

            // actualiza el estado local eliminando el comentario
            const updatedPosts = posts.map(p => {
                if (p.post_id === post.post_id) {
                    return {
                        ...p,
                        comments: p.comments.filter(c => c.comment_id !== comment.comment_id),
                    };
                }
                return p;
            });
            setPosts(updatedPosts);
        } catch (err) {
            console.error('Error al eliminar el comentario:', err.message);
            alert('Hubo un error al eliminar el comentario. Intente nuevamente.');
        }
    };
    // a partir de aquí se renderiza el comentario y vaina desa
    return (
        <div className={`comment ${expanded ? 'expanded' : ''}`}>
            {editing ? (
                <textarea 
                    value={editedContent} 
                    onChange={(e) => setEditedContent(e.target.value)} 
                    className="edit-comment-input"
                />
            ) : (
                <p>{comment.comment_text}</p> // Renderiza el texto del comentario
            )}
            {comment.multimedia && comment.multimedia.map((media, index) => (
                media.media_type === 'video' ? (
                    <video 
                        key={index}
                        controls 
                        className={`comment-media ${expanded ? 'expanded' : 'minimized'}`} 
                        onClick={handleMediaClick}
                        src={media.multimedia_url}
                    />
                ) : (
                    <img 
                        key={index}
                        src={media.multimedia_url} 
                        alt="Comment media" 
                        className={`comment-media ${expanded ? 'expanded' : 'minimized'}`} 
                        onClick={handleMediaClick}
                    />
                )
            ))}
            <div className="comment-actions">
                {editing && (
                    <button className="save-edit-button" onClick={handleSaveEdit}>
                        Guardar
                    </button>
                )}
            </div>
            <div className="comment-options">
                <button className="options-button" onClick={() => setShowOptions(!showOptions)}>⋮</button>
                {showOptions && (
                    <div className="options-menu">
                        <button onClick={handleEditComment}>Editar</button>
                        <button onClick={handleDeleteComment}>Eliminar</button>
                    </div>
                )}
            </div>
            {expanded && <div className="overlay" onClick={handleMediaClick}></div>}
        </div>
    );
}

export default Comment;

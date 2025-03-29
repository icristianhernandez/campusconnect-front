import React, { useState, useEffect } from 'react';
import './Comment.css';
import { supabase } from '../../utils/supabase';

function Comment({ comment, post, setPosts, posts }) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.comment_text);
    const [showCommentOptions, setShowCommentOptions] = useState(false); // Renamed state variable
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (!error && user) {
                setUserId(user.id);
            }
        };
        fetchUser();
    }, []);

    const handleMediaClick = () => {
        setExpanded(!expanded);
    };

    const handleEditComment = () => {
        setEditing(true);
        setShowCommentOptions(false); // Using the renamed state
    };

    const handleSaveEdit = async () => {
        try {
            const { error } = await supabase
                .from('comments')
                .update({ comment_text: editedContent })
                .eq('comment_id', comment.comment_id);

            if (error) throw error;

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
            setEditing(false);
        } catch (err) {
            console.error('Error al actualizar el comentario:', err.message);
            alert('Hubo un error al actualizar el comentario. Intente nuevamente.');
        }
    };

    const handleDeleteComment = async () => {
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('comment_id', comment.comment_id);

            if (error) throw error;

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

    // Close options menu when clicking outside
    useEffect(() => {
        if (showCommentOptions) {
            const handleClickOutside = () => {
                setShowCommentOptions(false);
            };
            
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [showCommentOptions]);

    // Handle options toggle with stopPropagation to prevent the document click handler
    const toggleOptions = (e) => {
        e.stopPropagation();
        setShowCommentOptions(!showCommentOptions);
    };

    return (
        <div className={`comment ${expanded ? 'expanded' : ''}`}>
            {editing ? (
                <textarea 
                    value={editedContent} 
                    onChange={(e) => setEditedContent(e.target.value)} 
                    className="edit-comment-input"
                />
            ) : (
                <p className="comment-text">{comment.comment_text}</p>
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
            
            {/* New comment options UI that's independent from posts */}
            {userId === comment.user_id && (
                <div className="comment-options-container">
                    <button 
                        className="comment-options-button" 
                        onClick={toggleOptions}
                        aria-label="Opciones de comentario"
                    >
                        •••
                    </button>
                    
                    {showCommentOptions && (
                        <div className="comment-options-dropdown">
                            <button 
                                className="comment-option-item" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditComment();
                                }}
                            >
                                <span className="comment-option-icon">✏️</span>
                                <span>Editar</span>
                            </button>
                            <button 
                                className="comment-option-item" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteComment();
                                }}
                            >
                                <span className="comment-option-icon">🗑️</span>
                                <span>Eliminar</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {expanded && <div className="overlay" onClick={handleMediaClick}></div>}
        </div>
    );
}

export default Comment;

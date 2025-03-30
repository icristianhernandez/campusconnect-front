import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Comment.css';
import { supabase } from '../../utils/supabase';

function Comment({ comment, post, setPosts, posts }) {
    // Core state management
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.comment_text);
    const [currentUserId, setCurrentUserId] = useState(null);
    
    // UI state management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    
    // Refs for DOM manipulation
    const editTextareaRef = useRef(null);
    const commentRef = useRef(null);
    const modalRef = useRef(null);
    
    // Add new state for reply functionality
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [replyMedia, setReplyMedia] = useState(null);
    const [replyLoading, setReplyLoading] = useState(false);

    // Add new state for showing/hiding replies
    const [showReplies, setShowReplies] = useState(false);

    // Fetch current user on component mount
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) throw error;
                if (user) setCurrentUserId(user.id);
            } catch (error) {
                console.error("Error fetching user:", error.message);
            }
        };
        
        fetchCurrentUser();
    }, []);
    
    // Focus input and set cursor at the end when editing begins
    useEffect(() => {
        if (isEditing && editTextareaRef.current) {
            const textarea = editTextareaRef.current;
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }, [isEditing]);
    
    // Handle clicking outside to cancel edit mode
    useEffect(() => {
        if (isEditing) {
            const handleClickOutside = (event) => {
                if (commentRef.current && !commentRef.current.contains(event.target)) {
                    handleCancelEdit();
                }
            };
            
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isEditing]);

    // Add effect to manage body class for modal
    useEffect(() => {
        if (showConfirmDelete) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [showConfirmDelete]);

    // Media handling
    const handleMediaClick = (e) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };
    
    // Edit operations
    const handleStartEdit = () => {
        setIsEditing(true);
        setEditText(comment.comment_text);
        setError(null);
    };
    
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditText(comment.comment_text);
        setError(null);
    };
    
    const handleSaveEdit = async () => {
        if (editText.trim() === '') {
            setError('El comentario no puede estar vacío');
            return;
        }
        
        if (editText === comment.comment_text) {
            setIsEditing(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const { error } = await supabase
                .from('comments')
                .update({ comment_text: editText })
                .eq('comment_id', comment.comment_id);
                
            if (error) throw error;
            
            // Update local state
            const updatedPosts = posts.map(p => {
                if (p.post_id === post.post_id) {
                    return {
                        ...p,
                        comments: p.comments.map(c => 
                            c.comment_id === comment.comment_id ? 
                            { ...c, comment_text: editText } : c
                        )
                    };
                }
                return p;
            });
            
            setPosts(updatedPosts);
            setIsEditing(false);
        } catch (err) {
            setError('Error al actualizar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Delete operations
    const handleDeleteComment = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('comment_id', comment.comment_id);
                
            if (error) throw error;
            
            // Update local state by filtering out the deleted comment
            const updatedPosts = posts.map(p => {
                if (p.post_id === post.post_id) {
                    return {
                        ...p,
                        comments: p.comments.filter(c => c.comment_id !== comment.comment_id)
                    };
                }
                return p;
            });
            
            setPosts(updatedPosts);
            setShowConfirmDelete(false);
        } catch (err) {
            setError('Error al eliminar: ' + err.message);
            setShowConfirmDelete(false);
        } finally {
            setLoading(false);
        }
    };
    
    // Keyboard handling for accessibility
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleCancelEdit();
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        }
    };

    // Create a portal for the delete confirmation modal
    const DeleteConfirmationModal = () => {
        if (!showConfirmDelete) return null;
        
        return createPortal(
            <div 
                className="modal-backdrop"
                onClick={(e) => {
                    e.preventDefault();
                    setShowConfirmDelete(false);
                }}
            >
                <div 
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                    ref={modalRef}
                >
                    <h3>Eliminar comentario</h3>
                    <p>¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer.</p>
                    
                    {error && <div className="delete-error">{error}</div>}
                    
                    <div className="confirmation-buttons">
                        <button 
                            className="cancel-button" 
                            onClick={() => setShowConfirmDelete(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button 
                            className="confirm-button" 
                            onClick={handleDeleteComment}
                            disabled={loading}
                        >
                            {loading ? 'Eliminando...' : 'Eliminar'}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim() && !replyMedia) return;
        
        setReplyLoading(true);
        setError(null);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            // Create the reply comment
            const { data: newReply, error: replyError } = await supabase
                .from('comments')
                .insert({
                    comment_text: replyContent,
                    parent_post_id: post.post_id,
                    parent_comment_id: comment.comment_id,
                    user_id: user.id,
                })
                .select()
                .single();

            if (replyError) throw replyError;

            let multimedia = [];
            if (replyMedia) {
                const fileName = `${newReply.comment_id}-${replyMedia.name}`;
                const { error: storageError } = await supabase
                    .storage
                    .from('nose') // Your bucket name
                    .upload(fileName, replyMedia);

                if (storageError) throw storageError;

                const { data: { publicUrl }, error: urlError } = supabase
                    .storage
                    .from('nose') // Your bucket name
                    .getPublicUrl(fileName);

                if (urlError) throw urlError;

                const { error: multimediaError } = await supabase
                    .from('comments_multimedia')
                    .insert({
                        comment_id: newReply.comment_id,
                        media_type: replyMedia.type.startsWith('video/') ? 'video' : 'image',
                        multimedia_url: publicUrl,
                    });

                if (multimediaError) throw multimediaError;

                multimedia = [{
                    media_type: replyMedia.type.startsWith('video/') ? 'video' : 'image',
                    multimedia_url: publicUrl,
                }];
            }

            // Update local state
            const updatedPosts = posts.map(p => {
                if (p.post_id === post.post_id) {
                    return {
                        ...p,
                        comments: updateCommentsWithReply(p.comments, comment.comment_id, {
                            ...newReply,
                            multimedia,
                            replies: []
                        })
                    };
                }
                return p;
            });

            setPosts(updatedPosts);
            setReplyContent('');
            setReplyMedia(null);
            setShowReplyForm(false);
        } catch (err) {
            setError('Error al crear la respuesta: ' + err.message);
        } finally {
            setReplyLoading(false);
        }
    };

    // Helper function to update comments tree with new reply
    const updateCommentsWithReply = (comments, parentCommentId, newReply) => {
        return comments.map(c => {
            if (c.comment_id === parentCommentId) {
                return {
                    ...c,
                    replies: [...(c.replies || []), newReply]
                };
            }
            if (c.replies?.length > 0) {
                return {
                    ...c,
                    replies: updateCommentsWithReply(c.replies, parentCommentId, newReply)
                };
            }
            return c;
        });
    };

    return (
        <div 
            className={`comment ${expanded ? 'expanded' : ''} ${loading ? 'loading' : ''}`}
            ref={commentRef}
        >
            {/* User profile section */}
            <div className="comment-user-profile">
                <div className="comment-user-avatar-placeholder"></div>
                <div className="comment-user-info">
                    <p className="comment-username">Username placeholder</p>
                    <span className="comment-timestamp">
                        {new Date(comment.created_at).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Comment Content */}
            {isEditing ? (
                <div className="comment-edit-container">
                    <textarea 
                        ref={editTextareaRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="edit-comment-input"
                        placeholder="Escribe tu comentario..."
                        disabled={loading}
                    />
                    
                    {error && <div className="comment-error">{error}</div>}
                    
                    <div className="edit-actions">
                        <button 
                            className="cancel-edit-button" 
                            onClick={handleCancelEdit}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button 
                            className="save-edit-button" 
                            onClick={handleSaveEdit}
                            disabled={loading || editText.trim() === ''}
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <p className="comment-text">{comment.comment_text}</p>
                    
                    {/* Action buttons (only show if user owns the comment) */}
                    {currentUserId === comment.user_id && !loading && (
                        <div className="comment-action-buttons">
                            <button 
                                className="action-button edit-button" 
                                onClick={handleStartEdit}
                                aria-label="Editar comentario"
                                title="Editar comentario"
                            >
                                <span className="button-icon">✏️</span>
                            </button>
                            <button 
                                className="action-button delete-button" 
                                onClick={() => setShowConfirmDelete(true)}
                                aria-label="Eliminar comentario"
                                title="Eliminar comentario"
                            >
                                <span className="button-icon">🗑️</span>
                            </button>
                        </div>
                    )}
                </>
            )}
            
            {/* Media content */}
            {comment.multimedia && comment.multimedia.length > 0 && comment.multimedia.map((media, index) => (
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
                        alt="Media adjunta al comentario" 
                        className={`comment-media ${expanded ? 'expanded' : 'minimized'}`} 
                        onClick={handleMediaClick}
                    />
                )
            ))}
            
            <div className="comment-actions-container">
                {/* Add reply button only for main comments */}
                {!comment.parent_comment_id && (
                    <button 
                        className="reply-button"
                        onClick={() => setShowReplyForm(!showReplyForm)}
                    >
                        <img 
                            src="ícono respuesta comentarios.svg" 
                            alt="Responder" 
                            className="reply-icon"
                        />
                    </button>
                )}

                {/* Show replies button and count */}
                {!comment.parent_comment_id && comment.replies?.length > 0 && (
                    <button 
                        className="show-replies-button"
                        onClick={() => setShowReplies(!showReplies)}
                    >
                        <img 
                            src="ícono comentarios de comentarios.svg" 
                            alt="Ver respuestas" 
                            className="show-replies-icon"
                        />
                        <span className="replies-count">({comment.replies.length})</span>
                    </button>
                )}
            </div>

            {/* Reply form */}
            {showReplyForm && !comment.parent_comment_id && (
                <form onSubmit={handleReplySubmit} className="reply-form">
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        disabled={replyLoading}
                    />
                    <div className="reply-actions">
                        <label title="Adjuntar archivo">
                            📎
                            <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    setReplyMedia(file);
                                }}
                            />
                        </label>
                        <button 
                            type="submit" 
                            disabled={replyLoading || (!replyContent && !replyMedia)}
                        >
                            {replyLoading ? 'Enviando...' : 'Responder'}
                        </button>
                    </div>
                </form>
            )}

            {/* Solo se despliegan las respuestas si showRwplies es true*/}
            {showReplies && comment.replies?.length > 0 && (
                <div className="comment-replies">
                    {comment.replies.map(reply => (
                        <Comment
                            key={reply.comment_id}
                            comment={reply}
                            post={post}
                            setPosts={setPosts}
                            posts={posts}
                        />
                    ))}
                </div>
            )}

            {/* Delete confirmation modal rendered through portal */}
            <DeleteConfirmationModal />
            
            {/* Overlay for expanded media */}
            {expanded && (
                <div className="overlay" onClick={() => setExpanded(false)}></div>
            )}
            
            {/* Loading indicator */}
            {loading && (
                <div className="comment-loading-overlay">
                    <div className="comment-loading-spinner"></div>
                </div>
            )}
        </div>
    );
}

export default Comment;

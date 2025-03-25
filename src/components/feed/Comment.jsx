import React, { useState } from 'react';
import './Comment.css';

function Comment({ comment, post, setPosts, posts }) {
    const [liked, setLiked] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [showOptions, setShowOptions] = useState(false);

    const handleLikeComment = () => {
        const updatedPosts = posts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    comments: p.comments.map((c, index) => {
                        if (c === comment) {
                            return {
                                ...c,
                                likes: liked ? (c.likes || 0) - 1 : (c.likes || 0) + 1
                            };
                        }
                        return c;
                    })
                };
            }
            return p;
        });
        setPosts(updatedPosts);
        setLiked(!liked);
    };

    const handleMediaClick = () => {
        setExpanded(!expanded);
    };

    const handleEditComment = () => {
        setEditing(true);
        setShowOptions(false);
    };

    const handleSaveEdit = () => {
        const updatedPosts = posts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    comments: p.comments.map((c, index) => {
                        if (c === comment) {
                            return {
                                ...c,
                                content: editedContent
                            };
                        }
                        return c;
                    })
                };
            }
            return p;
        });
        setPosts(updatedPosts);
        setEditing(false);
    };

    const handleDeleteComment = () => {
        const updatedPosts = posts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    comments: p.comments.filter(c => c !== comment)
                };
            }
            return p;
        });
        setPosts(updatedPosts);
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
                comment.content
            )}
            {comment.media && (
                comment.mediaType.startsWith('video/') ? (
                    <video 
                        controls 
                        className={`comment-media ${expanded ? 'expanded' : 'minimized'}`} 
                        onClick={handleMediaClick}
                    >
                        <source src={URL.createObjectURL(comment.media)} type={comment.mediaType} />
                    </video>
                ) : (
                    <img 
                        src={URL.createObjectURL(comment.media)} 
                        alt="Comment media" 
                        className={`comment-media ${expanded ? 'expanded' : 'minimized'}`} 
                        onClick={handleMediaClick}
                    />
                )
            )}
            <div className="comment-actions">
                <button className={`like-button ${liked ? 'liked' : ''}`} onClick={handleLikeComment}>
                    ❤️ {comment.likes || 0}
                </button>
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

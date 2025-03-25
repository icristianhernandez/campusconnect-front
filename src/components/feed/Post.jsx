import React, { useState } from 'react';
import './Post.css';
import Comment from './Comment';
import { handleLike } from '../../utils/likeUtils';

function Post({ post, setPosts, posts }) {
    const [newCommentContent, setNewCommentContent] = useState("");
    const [newCommentMedia, setNewCommentMedia] = useState(null);
    const [newCommentMediaPreview, setNewCommentMediaPreview] = useState(null);
    const [liked, setLiked] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const [showOptions, setShowOptions] = useState(false);

    const handleCommentChange = (value) => {
        setNewCommentContent(value);
    };

    const handleCommentMediaChange = (e) => {
        const file = e.target.files[0];
        setNewCommentMedia(file);
        setNewCommentMediaPreview(URL.createObjectURL(file));
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        const updatedPosts = posts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    comments: [...p.comments, { content: newCommentContent, media: newCommentMedia, mediaType: newCommentMedia ? newCommentMedia.type : null, likes: 0 }]
                };
            }
            return p;
        });
        setPosts(updatedPosts);
        setNewCommentContent("");
        setNewCommentMedia(null);
        setNewCommentMediaPreview(null);
    };

    const handleLikePost = () => {
        handleLike(posts, setPosts, post.id, liked);
        setLiked(!liked);
    };

    const handleEditPost = () => {
        setEditing(true);
        setShowOptions(false);
    };

    const handleSaveEdit = () => {
        const updatedPosts = posts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    content: editedContent
                };
            }
            return p;
        });
        setPosts(updatedPosts);
        setEditing(false);
    };

    const handleDeletePost = () => {
        const updatedPosts = posts.filter(p => p.id !== post.id);
        setPosts(updatedPosts);
    };

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
                    post.content
                )}
                {post.media && (
                    post.mediaType.startsWith('video/') ? (
                        <video controls className="post-media">
                            <source src={URL.createObjectURL(post.media)} type={post.mediaType} />
                        </video>
                    ) : (
                        <img src={URL.createObjectURL(post.media)} alt="Post media" className="post-media" />
                    )
                )}
                <div className="post-actions">
                    <button className={`like-button ${liked ? 'liked' : ''}`} onClick={handleLikePost}>
                        ❤️ {post.likes}
                    </button>
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
                {post.comments && post.comments.map((comment, index) => (
                    <Comment key={index} comment={comment} post={post} setPosts={setPosts} posts={posts} />
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

import React, { useContext } from 'react';
import './Feed.css';
import Post from './Post';
import NewPostForm from './NewPostForm';
import { MyContext } from '../../context/context';

function Feed() {
    const { appState, dispatch } = useContext(MyContext);
    const { posts } = appState;

    const setPosts = (updatedPosts) => {
        dispatch({ type: 'SET_POSTS', payload: updatedPosts });
    };

    return (
        <div className="Feed">
            <div className="feed-container">
                <div className="left-column">
                    {/* Contenido adicional para la columna izquierda */}
                </div>
                <div className="middle-column">
                    <NewPostForm />
                    <div className="posts-container">
                        {posts && posts.map(post => (
                            <Post key={post.id} post={post} posts={posts} setPosts={setPosts} />
                        ))}
                    </div>
                </div>
                <div className="right-column">
                    {/* Contenido adicional para la columna derecha */}
                </div>
            </div>
        </div>
    );
}

export default Feed;

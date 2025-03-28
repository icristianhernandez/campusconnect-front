import React, { useContext, useEffect, useState } from 'react'; // Importa el hook useContext y useEffect
import './Feed.css'; // Importa estilos CSS del archivo feed.css
import Post from './Post'; //componente para post individual
import NewPostForm from './NewPostForm'; //componente para formulario de nuevo post
import { MyContext } from '../../context/context'; // Importa el contexto global para manejar el estado de la app
import { supabase } from '../../utils/supabase'; //supabase para interactuar con la db

function Feed() {
    const { appState, dispatch } = useContext(MyContext); // Obtiene el estado global y la funcion para actualizarlo (el dispatch)
    const { posts } = appState; //publicaciones almacenadas en estado global
    const [errorMessage, setErrorMessage] = useState(null); // para mostrar errores
    const [showNewPostForm, setShowNewPostForm] = useState(false); // Estado para controlar la visibilidad del formulario

    const setPosts = (updatedPosts) => {
        dispatch({ type: 'SET_POSTS', payload: updatedPosts }); //actualiza la lista de posts
    };

    const fetchPostsWithComments = async () => {
        setErrorMessage(null); // limpia errores previos
        try {
            // aca se consultan y obtienen losd atos de los posts y comentarios (multimedia incluida)

            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`
                    *,
                    post_multimedia (
                        media_type,
                        multimedia_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            const { data: commentsData, error: commentsError } = await supabase
                .from('comments')
                .select(`
                    *,
                    comments_multimedia (
                        media_type,
                        multimedia_url
                    )
                `);

            if (commentsError) throw commentsError;

            const combinedPosts = postsData.map(post => ({
                ...post,
                multimedia: post.post_multimedia || [],
                comments: commentsData
                    .filter(comment => comment.parent_post_id === post.post_id)
                    .map(comment => ({
                        ...comment,
                        multimedia: comment.comments_multimedia || []
                    }))
            }));

            setPosts(combinedPosts);
        } catch (error) {
            console.error('Error al obtener posts y comentarios:', error.message);
            setErrorMessage('Hubo un error al cargar los posts y comentarios. Por favor, intente nuevamente.');
        }
    };

    useEffect(() => { //hook para cargar posts y comentarios desde la db
        fetchPostsWithComments();
    }, []);
    // y esta parte es del renderizado del componente
    return (
        <div className="Feed">
            <div className="feed-container">
                <div className="left-column">
                    <button className="settings-button">
                        <img src="Configuración.svg" alt="Configuración" />
                        <span>Configuración</span>
                    </button>
                    {/* Contenido adicional para la columna izquierda */}
                </div>
                <div className="middle-column">
                    <button 
                        className="create-post-button" 
                        onClick={() => {
                            setShowNewPostForm(!showNewPostForm);
                            window.scrollTo({ top: 0, behavior: 'smooth' }); // Desplaza al principio de la página
                        }}
                    >
                        Crear
                    </button>
                    {showNewPostForm && <NewPostForm />} {/* Mostrar formulario solo si está habilitado */}
                    {errorMessage && <p className="error-message">{errorMessage}</p>} {/* Muestra errores */}
                    <div className="posts-container">
                        {posts && posts.map(post => (
                            <Post key={post.post_id} post={post} posts={posts} setPosts={setPosts} />
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

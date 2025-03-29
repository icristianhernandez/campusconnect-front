import './Landing.css'
import Login from './login/Login'
import bannerBackground from './assets/Banner-Web-USM-2.jpg'

function Landing(){

    /*BackGround*/
    const backgroundStyle = {
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(119, 119, 119, 0.7)), url(${bannerBackground})`, // Gray gradient overlay
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center' // Ensure the image is centered
    }

    return (
        <div style={backgroundStyle} className="Landing">
            <div className='logo-container'>
                <img src={`Logo-completo-blanco.png`} alt="Logo" className='landing-logo-completo'/>
            </div>
            <Login/>
        </div>
    )

};

export default Landing;
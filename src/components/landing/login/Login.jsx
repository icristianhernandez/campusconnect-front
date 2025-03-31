import "./Login.css";
import LoginForm from "./LoginForm";
import LoginForget from "./LoginForget";
import LoginRegister from "./LoginRegister";
import { useState } from "react";

function Login() {
	const [logOperation, setLogOperation] = useState(0);

	let contenido;

	if (logOperation == 0) contenido = <LoginForm />;
	if (logOperation == 1) contenido = <LoginForget />;
	if (logOperation == 2) contenido = <LoginRegister />;

	return (
		<div className="Login">
			{/*Colocar logos aqui*/}
			<div className="logos">
				<img src={`Símbolo.png`} alt="simbolo" />
				<img src={`usm.png`} alt="simbolo" />
			</div>

			{
				/*Se Muestran los formularios del login en base a la eleccion*/
				contenido
			}
			{
				/* Se cambia las elecciones del footer */
				logOperation == 0 ? (
					<div className="login-footer">
						<p>
							<a href="#" onClick={() => setLogOperation(1)}>
								¿Haz olvidado tu contraseña?
							</a>
						</p>
						<p>
							¿No tienes cuenta?{" "}
							<a href="#" onClick={() => setLogOperation(2)}>
								Registrate
							</a>
						</p>
					</div>
				) : logOperation == 1 ? (
					<div className="login-footer">
						<p>
							<a href="#" onClick={() => setLogOperation(0)}>
								Inicia Sesión
							</a>
						</p>
						<p>
							¿No tienes cuenta?{" "}
							<a href="#" onClick={() => setLogOperation(2)}>
								Registrate
							</a>
						</p>
					</div>
				) : (
					<div className="login-footer">
						<p>
							<a href="#" onClick={() => setLogOperation(1)}>
								¿Haz olvidado tu contraseña?
							</a>
						</p>
						<p>
							<a href="#" onClick={() => setLogOperation(0)}>
								Inicia Sesión
							</a>
						</p>
					</div>
				)
			}
		</div>
	);
}

export default Login;

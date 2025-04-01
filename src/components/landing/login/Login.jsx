import "./Login.css";
import LoginForm from "./LoginForm";
import LoginRegister from "./LoginRegister";
import { useState } from "react";

function Login() {
	const [logOperation, setLogOperation] = useState(0);

	let contenido;

	if (logOperation == 0) contenido = <LoginForm />;
	if (logOperation == 1) contenido = <LoginRegister />;

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
							¿No tienes cuenta?{" "}
							<a href="#" onClick={() => setLogOperation(1)}>
								Registrate
							</a>
						</p>
					</div>
				) : (
					<div className="login-footer">
						<p>
							<a href="#" onClick={() => setLogOperation(0)}>
							¿Ya tienes una cuenta? Inicia Sesión
							</a>
						</p>
					</div>
				)
			}
		</div>
	);
}

export default Login;

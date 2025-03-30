import { useState, useRef } from "react";
import { supabase } from "../../../utils/supabase";

function LoginForget() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [successMessage, setSuccessMessage] = useState(null);
	const emailRef = useRef(null);

	const handleSubmitForget = async (e) => {
		e.preventDefault();

		if (!emailRef.current?.value) {
			setError("Por favor ingrese su correo electrónico");
			return;
		}

		setLoading(true);
		setError(null);
		setSuccessMessage(null);

		try {
			const { error } = await supabase.auth.resetPasswordForEmail(
				emailRef.current.value,
				{
					redirectTo: window.location.origin + "/reset-password",
				},
			);

			if (error) {
				if (error.message === "Email not confirmed") {
					setError("El correo electrónico no está confirmado");
				} else if (error.message === "Email rate limit exceeded") {
					setError("Ha excedido el límite de intentos. Intente más tarde");
				} else {
					setError(
						error.message || "Error al enviar el correo de recuperación",
					);
				}
			} else {
				setSuccessMessage(
					"Se ha enviado un correo para restablecer su contraseña",
				);
				emailRef.current.value = "";
			}
		} catch (err) {
			setError("Error al procesar la solicitud");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="LoginForget" onSubmit={handleSubmitForget}>
			<div>
				<input
					type="email"
					name="reqEmail"
					id="reqEmail"
					placeholder="Ingrese su correo electrónico"
					className="login-form-input"
					ref={emailRef}
					maxLength={64}
					disabled={loading}
					required
				/>
			</div>

			{error && (
				<div className="login-form-status">
					<p className="login-error">{error}</p>
				</div>
			)}

			{successMessage && (
				<div className="login-form-status">
					<p className="login-success">{successMessage}</p>
				</div>
			)}

			<div>
				<button className="login-form-submit" type="submit" disabled={loading}>
					{loading ? "Enviando..." : "Enviar Email de recuperación"}
				</button>
			</div>
		</form>
	);
}

export default LoginForget;

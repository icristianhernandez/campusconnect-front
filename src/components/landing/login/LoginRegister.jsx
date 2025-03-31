import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabase";

function LoginRegister() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [passwordError, setPasswordError] = useState(null);
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
	const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State to toggle confirm password visibility

	const emailRef = useRef(null);
	const passwordRef = useRef(null);
	const confirmPasswordRef = useRef(null);
	const firstNameRef = useRef(null);
	const lastNameRef = useRef(null);

	const validatePasswords = () => {
		if (passwordRef.current.value !== confirmPasswordRef.current.value) {
			setPasswordError("Las contraseñas no coinciden");
			return false;
		}

		if (passwordRef.current.value.length < 6) {
			setPasswordError("La contraseña debe tener al menos 6 caracteres");
			return false;
		}

		setPasswordError(null);
		return true;
	};

	const handleSubmitRegister = async (e) => {
		e.preventDefault();

		// Validate form
		if (!termsAccepted) {
			setError("Debe aceptar los términos y condiciones");
			return;
		}

		if (!validatePasswords()) {
			return;
		}

		setLoading(true);
		setError(null);

		const email = emailRef.current.value;
		const password = passwordRef.current.value;
		const firstName = firstNameRef.current.value;
		const lastName = lastNameRef.current.value;

		try {
			const { data, error: signUpError } = await supabase.auth.signUp({
				email: email,
				password: password,
				options: {
					data: {
						first_name: firstName,
						last_name: lastName,
					},
				},
			});

			if (signUpError) {
				if (signUpError.message.includes("email")) {
					setError("Este correo electrónico ya está registrado");
				} else {
					setError(signUpError.message || "Error al crear la cuenta");
				}
				return;
			} else {
				navigate("/feed");
			}
		} catch (err) {
			setError("Error al procesar el registro");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="LoginRegister" onSubmit={handleSubmitRegister}>
			<div>
				<input
					type="text"
					name="firstName"
					id="firstName"
					placeholder="Ingrese su nombre"
					className="login-form-input"
					ref={firstNameRef}
					disabled={loading}
					required
					maxLength={24}
				/>
			</div>
			<div>
				<input
					type="text"
					name="lastName"
					id="lastName"
					placeholder="Ingrese su apellido"
					className="login-form-input"
					ref={lastNameRef}
					disabled={loading}
					required
					maxLength={24}
				/>
			</div>
			<div>
				<input
					type="email"
					name="regEmail"
					id="regEmail"
					placeholder="Ingrese su correo electrónico"
					className="login-form-input"
					ref={emailRef}
					maxLength={64}
					disabled={loading}
					required
				/>
			</div>
			<div className="password-container">
				<input
					type={showPassword ? "text" : "password"}
					name="regPassWord"
					id="regPassWord"
					placeholder="Ingrese su contraseña"
					className="login-form-input"
					ref={passwordRef}
					maxLength={32}
					disabled={loading}
					onChange={validatePasswords}
					required
				/>
				<span
					className="toggle-password"
					onClick={() => setShowPassword(!showPassword)}
				>
					{showPassword ? "🙈" : "👁️"}
				</span>
			</div>
			<div className="password-container">
				<input
					type={showConfirmPassword ? "text" : "password"}
					name="regRepPassWord"
					id="regRepPassWord"
					placeholder="Repita su contraseña"
					className="login-form-input"
					ref={confirmPasswordRef}
					maxLength={32}
					disabled={loading}
					onChange={validatePasswords}
					required
				/>
				<span
					className="toggle-password"
					onClick={() => setShowConfirmPassword(!showConfirmPassword)}
				>
					{showConfirmPassword ? "🙈" : "👁️"}
				</span>
			</div>
			{passwordError && (
				<div className="login-form-validation">
					<p className="login-error">{passwordError}</p>
				</div>
			)}

			{error && (
				<div className="login-form-status">
					<p className="login-error">{error}</p>
				</div>
			)}

			<div>
				<input
					type="checkbox"
					name="acceptTerms"
					id="acceptTerms"
					checked={termsAccepted}
					onChange={() => setTermsAccepted(!termsAccepted)}
					disabled={loading}
				/>
				Acepto los &nbsp;<a href="#">Términos y condiciones</a>
			</div>

			<div>
				<button className="login-form-submit" type="submit" disabled={loading}>
					{loading ? "Creando cuenta..." : "Crear Cuenta"}
				</button>
			</div>
		</form>
	);
}

export default LoginRegister;

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    try {
      await register(username, email, password, confirmPassword);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "L'inscription a échoué. Veuillez réessayer.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-900">Créer votre compte</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-700 font-medium text-center">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700">Nom d'utilisateur</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                placeholder="Votre nom d'utilisateur"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Adresse e-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                placeholder="Votre adresse e-mail"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                placeholder="Votre mot de passe"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                placeholder="Confirmez votre mot de passe"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center rounded-lg bg-primary-600 px-4 py-2 text-base font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {isLoading ? "Création du compte..." : "S'inscrire"}
              </button>
            </div>
          </form>
        </div>
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-800">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

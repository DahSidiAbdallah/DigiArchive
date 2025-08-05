import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Vous devez être connecté pour voir votre profil.</p>
        <a
          href="/login"
          className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
        >
          Se connecter
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-8">
      <h2 className="text-2xl font-bold text-primary-700 mb-6">Profil de l'utilisateur</h2>
      <dl className="divide-y divide-gray-200">
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-gray-500">Nom d'utilisateur</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{user.username}</dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-gray-500">Email</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{user.email}</dd>
        </div>
        {user.first_name && (
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Prénom</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{user.first_name}</dd>
          </div>
        )}
        {user.last_name && (
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Nom</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{user.last_name}</dd>
          </div>
        )}
        {user.department && (
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Département</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{user.department}</dd>
          </div>
        )}
        {user.position && (
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Poste</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{user.position}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}


import { Fragment } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'
import NotificationBell from '@/components/NotificationBell'

const navigation = [
  { name: 'Accueil', href: '/', public: true },
  { name: 'Tableau de bord', href: '/dashboard', public: false },
  { name: 'Documents', href: '/documents', public: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Layout() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const navItems = navigation.filter(item => item.public || isAuthenticated);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <Disclosure as="nav" className="bg-white shadow-md border-b border-gray-200">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-20 items-center justify-between">
                {/* Logo and Nav */}
                <div className="flex items-center gap-8">
                  <Link to="/" className="flex items-center gap-2">
                    <img src="/src/assets/logo.png" alt="MAFCI Logo" className="h-12 w-auto" />
                    
                  </Link>
                  <div className="hidden md:flex md:gap-2 lg:gap-6">
                    {navItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          item.href === location.pathname
                            ? 'text-primary-700 border-b-2 border-primary-500 bg-primary-50'
                            : 'text-gray-600 hover:text-primary-700 hover:bg-primary-50',
                          'px-4 py-2 rounded-md text-base font-medium transition-colors duration-150'
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                {/* User Actions */}
                <div className="flex items-center gap-4">
                  {isAuthenticated ? (
                    <>
                      <NotificationBell />
                      <Menu as="div" className="relative">
                        <div>
                          <Menu.Button className="flex items-center gap-2 rounded-full bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 border border-gray-200 hover:shadow">
                            <UserCircleIcon className="h-8 w-8 text-primary-400" aria-hidden="true" />
                            <span className="hidden md:block font-semibold text-gray-700">{user?.username || 'User'}</span>
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-[999] mt-2 w-56 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
                            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                              <div className="font-semibold">{user?.username || 'User'}</div>
                              <div className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</div>
                            </div>
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to="/profile"
                                  className={classNames(
                                    active ? 'bg-primary-50' : '',
                                    'block px-4 py-2 text-sm text-gray-700 rounded-md transition'
                                  )}
                                >
                                  Votre Profil
                                </Link>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={logout}
                                  className={classNames(
                                    active ? 'bg-primary-50' : '',
                                    'block w-full text-left px-4 py-2 text-sm text-gray-700 rounded-md transition'
                                  )}
                                >
                                  Se déconnecter
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/login"
                        className="text-base font-medium text-gray-500 hover:text-primary-700 px-3 py-2 rounded-md transition"
                      >
                        Se connecter
                      </Link>
                      <Link
                        to="/register"
                        className="rounded-md bg-primary-600 px-4 py-2 text-base font-semibold text-white hover:bg-primary-700 shadow-sm transition"
                      >
                        S'inscrire
                      </Link>
                    </div>
                  )}
                  {/* Mobile menu button */}
                  <div className="md:hidden">
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile Nav Panel */}
            <Disclosure.Panel className="md:hidden bg-white border-t border-gray-200 shadow-lg">
              <div className="px-4 pt-4 pb-2 space-y-1">
                {navItems.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className={classNames(
                      item.href === location.pathname
                        ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700',
                      'block px-4 py-2 rounded-md text-base font-medium transition'
                    )}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 pb-2 px-4">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <UserCircleIcon className="h-8 w-8 text-primary-400" aria-hidden="true" />
                      <div>
                        <div className="text-base font-semibold text-gray-800">{user?.username || 'User'}</div>
                        <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
                      </div>
                    </div>
                    <Disclosure.Button
                      as={Link}
                      to="/profile"
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md transition"
                    >
                      Votre Profil
                    </Disclosure.Button>
                    <Disclosure.Button
                      as="button"
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md transition"
                    >
                      Se déconnecter
                    </Disclosure.Button>
                  </>
                ) : (
                  <>
                    <Disclosure.Button
                      as={Link}
                      to="/login"
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-md transition"
                    >
                      Se connecter
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      to="/register"
                      className="block w-full text-left px-4 py-2 text-base font-medium text-primary-700 hover:bg-primary-50 rounded-md transition"
                    >
                      S'inscrire
                    </Disclosure.Button>
                  </>
                )}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} DigiArchive. Tous les droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

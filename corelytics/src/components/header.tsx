import { useState } from 'react'
import { useSession, signOut } from "next-auth/react";
import Link from 'next/link'
import Image from 'next/image'

import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import {
  ArrowPathIcon,
  Bars3Icon,
  ChartPieIcon,
  CursorArrowRaysIcon,
  FingerPrintIcon,
  SquaresPlusIcon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, PhoneIcon, PlayCircleIcon } from '@heroicons/react/20/solid'

export default function Header() {

const products = [
  { name: 'Analitika', description: 'Értsd meg jobban a forgalmadat', href: '#', icon: ChartPieIcon },
  { name: 'Elköteleződés', description: 'Beszélj közvetlenül az ügyfeleidhez', href: '#', icon: CursorArrowRaysIcon },
  { name: 'Biztonság', description: 'Az ügyfeleid adatai biztonságban lesznek', href: '#', icon: FingerPrintIcon },
  { name: 'Integrációk', description: 'Csatlakozz harmadik fél eszközeihez', href: '#', icon: SquaresPlusIcon },
  { name: 'Automatizálás', description: 'Építs stratégiai tölcséreket', href: '#', icon: ArrowPathIcon },
]
const callsToAction = [
  { name: 'Demó megtekintése', href: '#', icon: PlayCircleIcon },
  { name: 'Kapcsolatfelvétel', href: '#', icon: PhoneIcon },
]

const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
const { data: session } = useSession();

  return (
    <header className="bg-transparent">
      <nav aria-label="Global" className="mx-auto w-[80%] flex items-center justify-between my-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Corelytics Logo</span>
            <Image
              alt="Corelytics Logo"
              src="/logo.svg"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>
        <div className="flex lg:hidden dark:invert">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Főmenü megnyitása</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
        <PopoverGroup className="hidden lg:flex lg:gap-x-12">
          <Link href="/#meals" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">
            Ételek
          </Link>
          <Link href="/#workouts" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">
            Edzések
          </Link>
          <Link href="/#conclusion" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">
            Konklúzió
          </Link>
        </PopoverGroup>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            {session?.user ? (
              <Menu as="div" className="relative">
                <MenuButton className="flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900 dark:text-gray-100">
                  {session?.user?.name}
                  <ChevronDownIcon aria-hidden="true" className="size-5 flex-none text-gray-400" />
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-3 w-56 origin-top-right overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-gray-900/5 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                >
                  <MenuItem>
                    <Link
                      href="/user"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 data-focus:bg-gray-50 dark:data-focus:bg-gray-700"
                    >
                      <div className="flex items-center gap-x-2">
                        <UserCircleIcon className="size-5" />
                        <span>Profil</span>
                      </div>
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      href="/food/log"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 data-focus:bg-gray-50 dark:data-focus:bg-gray-700"
                    >
                      <div className="flex items-center gap-x-2">
                        <ChartPieIcon className="size-5" />
                        <span>Étel Naplózása</span>
                      </div>
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      href="/workout"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 data-focus:bg-gray-50 dark:data-focus:bg-gray-700"
                    >
                      <div className="flex items-center gap-x-2">
                        <CursorArrowRaysIcon className="size-5" />
                        <span>Edzés Naplózása</span>
                      </div>
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 data-focus:bg-gray-50 dark:data-focus:bg-gray-700"
                    >
                      <div className="flex items-center gap-x-2">
                        <ArrowRightOnRectangleIcon className="size-5" />
                        <span>Kijelentkezés</span>
                      </div>
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
          ) : (
          <a href="/auth/signin" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">
            Bejelentkezés <span aria-hidden="true">&rarr;</span>
          </a>
          )}
        </div>
      </nav>
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">Corelytics Logo</span>
              <Image
                alt="Corelytics Logo"
                src="/logo.svg"
                className="h-8 w-auto"
              width={32}
              height={32}
              />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
            >
              <span className="sr-only">Menü bezárása</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                <Link
                  href="/#meals"
                  className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Ételek
                </Link>
                <Link
                  href="/#workouts"
                  className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Edzések
                </Link>
                <Link
                  href="/#conclusion"
                  className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Konklúzió
                </Link>
              </div>
              <div className="py-6">
            {session?.user ? (
              <div className="space-y-2">
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  {session?.user?.name}
                </div>
                <a
                  href="/user"
                  className="-mx-3 flex items-center gap-x-2 rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <UserCircleIcon className="size-5" />
                  <span>Profil</span>
                </a>
                <a
                  href="/food/log"
                  className="-mx-3 flex items-center gap-x-2 rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <ChartPieIcon className="size-5" />
                  <span>Étel Naplózása</span>
                </a>
                <a
                  href="/workout"
                  className="-mx-3 flex items-center gap-x-2 rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <CursorArrowRaysIcon className="size-5" />
                  <span>Edzés Naplózása</span>
                </a>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="-mx-3 flex w-full items-center gap-x-2 rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowRightOnRectangleIcon className="size-5" />
                  <span>Kijelentkezés</span>
                </button>
              </div>
          ) : (
          <a href="/auth/signin" className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">
            Bejelentkezés <span aria-hidden="true">&rarr;</span>
          </a>
          )}
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}
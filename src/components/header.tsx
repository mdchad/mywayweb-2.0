import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { LogOut, Menu } from "lucide-react";
import { LogoBig } from "@/components/Logo";
import { Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ReactNode } from "react";

export type KutubBook = {
  slug: string;
  title: string;
  arabic: string;
  description: string;
};

export const KUTUB_SITTAH: KutubBook[] = [
  {
    slug: "bukhari",
    title: "Sahih al-Bukhari",
    arabic: "صحيح البخاري",
    description: "Kitab hadis paling sahih, 7,563 hadis pilihan.",
  },
  {
    slug: "muslim",
    title: "Sahih Muslim",
    arabic: "صحيح مسلم",
    description: "Kitab hadis kedua paling sahih selepas al-Bukhari.",
  },
  {
    slug: "nasai",
    title: "Sunan Al-Nasa'i",
    arabic: "سنن النسائي",
    description: "Kitab hadis ketiga selepas Sahihayn, mengandungi 5,758",
  },
  {
    slug: "abi-daud",
    title: "Sunan Abu Dawud",
    arabic: "سنن أبي داود",
    description: "Kitab karangan Imam Abu Dawud yang beliau kumpulkan selama 20 tahun, mempunyai 5,274 hadis karangan.",
  },
  {
    slug: "tirmidhi",
    title: "Jami' Al-Tirmidhi",
    arabic: "سنن الترمذي",
    description: "Kitab hadis karangan Imam Tirmidhi yang mempunyai 3,956 hadis.",
  },
  {
    slug: "ibn-majah",
    title: "Sunan Ibn Majah",
    arabic: "سنن ابن ماجه",
    description: "Imam Ibn Majah mengumpulkan sebanyak 4,341 hadis di dalam kitab hadis ini",
  },
];

// NOTE(port): links to routes that haven't been ported yet (/book/*, /books,
// /hadis40, /chat, /login) are plain <a> tags; swap to typed <Link> as each
// route lands.
const KutubSittahDropdown = () => (
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger className="cursor-pointer font-sans font-[400] text-xs hover:text-foreground h-auto px-0 py-0 bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent data-[state=open]:text-foreground">
          KUTUB SITTAH
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[560px] grid-cols-2 gap-2 p-3">
            {KUTUB_SITTAH.map((book) => (
              <li key={book.slug}>
                <NavigationMenuLink asChild>
                  <a
                    href={`/book/${book.slug}`}
                    className="block select-none rounded-sm border border-transparent p-3 leading-none no-underline outline-none transition-colors hover:border-[#d6d6d6] hover:bg-accent focus:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-royal-blue">
                        {book.title}
                      </div>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                      {book.description}
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
            ))}
            <li className="col-span-2">
              <NavigationMenuLink asChild>
                <a
                  href="/books"
                  className="flex items-center justify-between rounded-sm border border-[#d6d6d6] bg-gray-50 px-3 py-2 text-xs font-mono uppercase text-[#f80] transition-colors hover:bg-gray-100"
                >
                  <span>Lihat Semua Koleksi</span>
                  <span className="text-sm leading-none">↗</span>
                </a>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);

const NavLinks = () => (
  <>
    <a
      href="/intro-malay.pdf"
      className="font-sans text-xs hover:text-foreground hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      PENGENALAN
    </a>
    <a
      href="/hadis40"
      className="font-sans text-xs whitespace-nowrap hover:text-foreground hover:underline"
    >
      HADIS 40
    </a>
    <KutubSittahDropdown />
    <a
      href="/chat"
      className="font-sans text-xs whitespace-nowrap hover:text-foreground hover:underline"
    >
      Tanya AI
    </a>
  </>
);

const MobileNavLinks = () => (
  <>
    <a
      href="/intro-malay.pdf"
      className="font-sans text-xs hover:text-foreground hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      PENGENALAN
    </a>
    <a
      href="/hadis40"
      className="font-sans text-xs whitespace-nowrap hover:text-foreground hover:underline"
    >
      HADIS 40
    </a>
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="kutub-sittah" className="border-b-0">
        <AccordionTrigger className="font-sans text-xs uppercase py-2 hover:no-underline">
          KUTUB SITTAH
        </AccordionTrigger>
        <AccordionContent className="pb-2">
          <ul className="flex flex-col gap-1 pl-2">
            {KUTUB_SITTAH.map((book) => (
              <li key={book.slug}>
                <a
                  href={`/book/${book.slug}`}
                  className="flex items-center justify-between gap-3 rounded-sm py-1.5 text-sm hover:underline"
                >
                  <span className="font-medium text-royal-blue">
                    {book.title}
                  </span>
                  <span className="font-book text-sm text-royal-blue/60">
                    {book.arabic}
                  </span>
                </a>
              </li>
            ))}
            <li>
              <a
                href="/books"
                className="mt-1 inline-flex items-center gap-1 py-1.5 font-mono text-xs uppercase text-foreground hover:underline"
              >
                Lihat Semua <span className="text-sm leading-none">↗</span>
              </a>
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    <a
      href="/chat"
      className="font-sans text-xs whitespace-nowrap hover:text-foreground hover:underline"
    >
      Tanya AI
    </a>
  </>
);

const Navbar = ({ children }: { children?: ReactNode }) => {
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    window.location.assign("/login");
  }

  return (
    <nav className="w-full bg-white">
      {/* Mobile Navigation */}
      <div className="lg:hidden w-full px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Buka menu navigasi">
                <Menu size={24} className="text-gray-600" aria-hidden="true" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Menu Navigasi</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-4">
                <div className="flex flex-col space-y-4">
                  <MobileNavLinks />
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <Link
            to="/"
            className="flex gap-2 font-semibold lg:text-base"
          >
            <LogoBig width={100} height={49} priority />
          </Link>
          <div className="flex-1 mx-4 h-8 self-start">{children}</div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="shrink-0">
                <Link
                  to="/"
                  className="flex items-center gap-2 font-semibold lg:text-base"
                >
                  <LogoBig width={140} height={69} priority />
                </Link>
              </div>
              <div className="ml-10 flex items-baseline space-x-8 content-stretch">
                <NavLinks />
              </div>
            </div>

            {/* Right Side - Sign In & Get Started */}
            <div className="hidden lg:flex gap-4 items-center h-8">
              <div className="flex items-center h-full">
                {children}
              </div>
              <div className="h-full bg-[#d6d6d6] w-[1px]"></div>
              {session ? (
                <Button
                  size="sm"
                  className="font-mono hover:bg-white cursor-pointer bg-white text-black rounded-none shadow-none border border-[#d6d6d6] hover:border-[#b8b8b8] h-full"
                  onClick={handleSignOut}
                >
                  <LogOut aria-hidden="true" />
                  KELUAR
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="font-mono hover:bg-white cursor-pointer bg-white text-black rounded-none shadow-none border border-[#d6d6d6] hover:border-[#b8b8b8] h-full"
                >
                  <a href="/login">MASUK</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

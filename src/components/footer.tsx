import { Link, type LinkProps } from "@tanstack/react-router";
import { LogoBig } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { AppStoreLink } from "@/components/AppStoreLink";
import { PlayStoreLink } from "@/components/PlayStoreLink";

export function Footer() {
	// `to` = ported route (client-side <Link>); `href` = not yet ported.
	const company: Array<{ title: string; href?: string; to?: LinkProps["to"] }> = [
		{ title: "Pengenalan", href: "/intro-malay.pdf" },
		{ title: "Kutub Sittah", to: "/books" },
		{ title: "Hadis 40", to: "/hadis40" },
		{ title: "Polisi Privasi", href: "/privacy" },
		{ title: "Servis Terma", href: "/terms" },
	];

	return (
		<footer>
			<div
				className={cn(
					"mx-auto max-w-5xl lg:border-x",
					"dark:bg-[radial-gradient(35%_80%_at_30%_0%,--theme(--color-foreground/.1),transparent)]"
				)}
			>
				<div className="absolute inset-x-0 h-px w-full bg-border" />
				<div className="grid max-w-5xl grid-cols-6 gap-6 p-4">
					<div className="col-span-6 flex flex-col gap-4 pt-5 md:col-span-4">
						<a className="w-max" href="/">
							<LogoBig width={150} height={73} />
						</a>
						<p className="max-w-sm text-balance font-mono text-muted-foreground text-sm">
							Platform Digital Hadis.
						</p>
						<div className="flex gap-2">
							<AppStoreLink />
							<PlayStoreLink />
						</div>
					</div>
					<div className="col-span-3 w-full md:col-span-1 md:col-start-6">
						<span className="text-muted-foreground text-xs">Link</span>
						<div className="mt-2 flex flex-col gap-2">
							{company.map(({ href, to, title }) =>
								to ? (
									<Link
										className="w-max text-sm hover:underline"
										to={to}
										key={title}
									>
										{title}
									</Link>
								) : (
									<a
										className="w-max text-sm hover:underline"
										href={href}
										key={title}
									>
										{title}
									</a>
								),
							)}
						</div>
					</div>
				</div>
				<div className="absolute inset-x-0 h-px w-full bg-border" />
				<div className="flex max-w-4xl flex-col justify-between gap-2 py-4">
					<p className="text-center font-light text-muted-foreground text-sm">
						&copy; {new Date().getFullYear()} MyWay by ATHAR Foundation. All rights reserved.
					</p>
					<p className="text-center font-light text-muted-foreground text-xs">
						Dibangunkan oleh{" "}
						<a
							href="https://pixelmindstudio.co"
							target="_blank"
							rel="noopener"
							className="hover:underline"
						>
							Pixelmind Studio
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}

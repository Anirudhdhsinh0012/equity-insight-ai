"use client";
import React from 'react';
import AuthCard from '@/components/AuthCard';

export default function LoginPage() {
	return (
		<main className="min-h-screen relative flex items-center justify-center bg-black text-white overflow-hidden">
			{/* Subtle animated gradient background */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.15),transparent_55%)]" aria-hidden="true" />
			<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:120px_120px] opacity-30" aria-hidden="true" />
			<div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]" aria-hidden="true" />

			<div className="relative w-full px-4 sm:px-6 py-16 flex flex-col items-center gap-12">
				<div className="text-center max-w-2xl">
					<h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 bg-clip-text text-transparent mb-4">
						Welcome to Stock Advisor Pro
					</h1>
					<p className="text-slate-400 text-sm sm:text-base leading-relaxed">
						Securely access AI-driven analytics, personalized insights, and real-time market data. Create an account or sign in to continue.
					</p>
				</div>

				<AuthCard showTitle={false} />

				<p className="text-[11px] text-slate-500 mt-8 max-w-md text-center">
					Demo environment: authentication is stored locally for prototype purposes. Integrate a production-grade backend & session store before deploying to users.
				</p>
			</div>
		</main>
	);
}

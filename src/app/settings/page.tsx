"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import SettingsPanel from '@/components/SettingsPanel';

export default function SettingsPage() {
	const search = useSearchParams();
	const tab = search?.get('tab') || 'profile';
	return <SettingsPanel initialTab={tab} />;
}


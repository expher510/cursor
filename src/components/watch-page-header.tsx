'use client';

import { useWatchPage } from '@/context/watch-page-context';
import { AppHeader } from './app-header';

function HeaderNotification() {
    const { notification } = useWatchPage();

    return (
        <>
            {notification && (
                <div
                    className="ml-4 text-sm font-medium text-muted-foreground"
                    >
                    {notification}
                </div>
            )}
        </>
    )
}

export function WatchPageHeader() {
    return (
        <AppHeader>
            <HeaderNotification />
        </AppHeader>
    );
}

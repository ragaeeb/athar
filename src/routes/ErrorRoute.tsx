import { Link, useRouteError } from 'react-router-dom';

type ErrorWithMessage = {
    message: string;
};

const isErrorWithMessage = (value: unknown): value is ErrorWithMessage =>
    typeof value === 'object' && value !== null && 'message' in value;

export const RouteError = () => {
    const error = useRouteError();
    const message = isErrorWithMessage(error) ? error.message : 'Unknown route failure.';

    return (
        <main className="flex min-h-screen items-center justify-center p-8">
            <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                <p className="font-display text-sm uppercase tracking-[0.4em] text-gold-400">Athar</p>
                <h1 className="mt-4 font-display text-4xl text-sand-50">Route Error</h1>
                <p className="mt-4 text-sand-100/80">{message}</p>
                <Link to="/" className="mt-6 inline-flex rounded-full bg-gold-400 px-5 py-3 font-semibold text-ink-950">
                    Return Home
                </Link>
            </div>
        </main>
    );
};

export function Footer() {
    return (
        <footer className="mt-16 bg-gray-900 py-8 text-white">
            <div className="container mx-auto px-4 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} LocalEvent Ethiopia. All rights reserved.</p>
            </div>
        </footer>
    );
}

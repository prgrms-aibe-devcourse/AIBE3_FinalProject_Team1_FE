/**
 * Footer 컴포넌트
 */
export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm text-gray-600">
            <p className="font-semibold">취밋</p>
            <p className="mt-1">P2P 취미 장비 대여 플랫폼</p>
          </div>
          <div className="text-sm text-gray-500">
            <p>© 2024 취밋. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}


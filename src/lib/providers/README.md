# Providers

React Provider 컴포넌트를 관리하는 폴더입니다.

## 구조

- `query-provider.tsx` - React Query Provider

## 사용 예시

Provider는 `app/layout.tsx`에서 사용됩니다.

```tsx
import { QueryProvider } from "@/lib/providers/query-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```


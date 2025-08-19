/// <reference types="react" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL?: string;
    [key: string]: string | undefined;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};

declare namespace React {
  interface ReactNode {}
  interface Component<P = {}, S = {}> {}
  interface ComponentClass<P = {}> {}
  interface FunctionComponent<P = {}> {
    (props: P & { key?: string | number }): ReactNode;
  }
  interface ReactElement {
    key?: string | number;
  }
  interface FormEvent<T = Element> {
    preventDefault(): void;
    target: T;
  }
  interface ChangeEvent<T = Element> {
    target: T & { value: string };
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}

declare module 'react/jsx-dev-runtime' {
  export * from 'react/jsx-dev-runtime';
}

declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export const Fragment: any;
  
  interface FormEvent<T = Element> {
    preventDefault(): void;
    target: T;
  }
  
  interface ChangeEvent<T = Element> {
    target: T & { value: string };
  }
  
  export { FormEvent, ChangeEvent };
  export default React;
}

declare module 'next/link' {
  interface LinkProps {
    href: string;
    children: React.ReactNode;
    [key: string]: any;
  }
  const Link: React.ComponentType<LinkProps>;
  export default Link;
}

declare module 'next/navigation' {
  interface Router {
    push(href: string): void;
    back(): void;
    forward(): void;
  }
  export function useRouter(): Router;
}

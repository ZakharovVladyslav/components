type Maybe<T> = T | undefined;
type Nullable<T> = T | null;
type Icon = FC<SVGProps<SVGSVGElement>>;
type Stringified<T> = T | string;
type Numbered<T> = T | number;
type Void<T> = T | void;
type ValueOf<T> = T[keyof T];
type TDefaultProps<T> = T & {
   className?: string;
};
type CombinedProps<T, U> = T & U;
type MaybeArray<T> = T | T[];

type Include<T> = {
   [K in keyof T]: T[K];
};

type TComponentDefaultProps<T> = T & {
   className?: string;
   disabled?: string;
};

type TDefaultOption = string | { value: string; translation?: string };

declare module '*.css';
declare module '*.scss';

export function cn(...classes: Maybe<Nullable<string | false>>[]): string {
   return classes.flat().filter(Boolean).join(' ');
}


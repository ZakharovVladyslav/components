import s from './preview.module.css';
import { cn } from '../../helpers/string';

export type PreviewProps = {
   className?: string;
   gradient: string;
};

export const Preview = ({ className, gradient }: PreviewProps) => (
   <section
      className={cn(className, s.wrapper, 'preview-wrapper')}
      style={{ background: gradient }}
   />
);

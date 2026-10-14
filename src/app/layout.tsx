import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Stockvel — Better together',description:'A beautiful, transparent way to manage South African stokvels and burial societies.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

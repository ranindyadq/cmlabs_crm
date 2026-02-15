import Image from "next/image";
import { redirect } from 'next/navigation';

export default function RootPage() {
  // 3. Langsung alihkan pengguna ke halaman signin
  redirect('/auth/signin');
}
import { redirect } from 'next/navigation';

// Replaces the old react-router catch-all: <Route path="*" element={<Navigate to="/" replace/>}/>
export default function NotFound() {
  redirect('/');
}

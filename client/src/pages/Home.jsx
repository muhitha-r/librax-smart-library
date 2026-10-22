import Login from './Login';
import Register from './Register';

export default function Home({ defaultTab = 'signin' }) {
  if (defaultTab === 'register') {
    return <Register />;
  }
  return <Login />;
}

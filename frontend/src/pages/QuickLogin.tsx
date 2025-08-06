// This file re-authenticates with the backend
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const auth = useAuth();
  
  const handleLogin = async () => {
    try {
      // Use the credentials you normally log in with
      await auth.login('admin', 'admin');
      alert('Authentication successful!');
    } catch (error) {
      console.error('Login error:', error);
      alert('Authentication failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      margin: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h1>DigiArchive Authentication</h1>
      <p>Your authentication token has expired. Click below to re-authenticate:</p>
      
      <button 
        onClick={handleLogin}
        style={{
          padding: '10px 15px',
          backgroundColor: '#4a6cf7',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Login (admin/admin)
      </button>
      
      <p style={{marginTop: '20px', fontSize: '14px', color: '#666'}}>
        After successful authentication, you can return to your previous activity.
      </p>
    </div>
  );
};

export default Login;

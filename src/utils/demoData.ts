// Demo data for testing the application
export const createDemoUser = () => {
  const demoUsers = [
    {
      id: 'demo-user-1',
      email: 'demo@autohealx.com',
      password: 'demo123',
      displayName: 'Demo User',
      createdAt: new Date().toISOString()
    }
  ];

  // Save demo users to localStorage if not already present
  const existingUsers = localStorage.getItem('autohealx_users');
  if (!existingUsers) {
    localStorage.setItem('autohealx_users', JSON.stringify(demoUsers));
    console.log('Demo user created: demo@autohealx.com / demo123');
  }
};

// Call this function to set up demo data
createDemoUser();
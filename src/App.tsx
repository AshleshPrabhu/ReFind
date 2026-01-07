import { useState } from 'react';
import Header from './Header';
import AuthModal from './AuthModal';  

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  const handleGetStarted = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header onGetStarted={handleGetStarted} onSignIn={handleSignIn} />

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <div className="h-screen flex items-center justify-center px-6">
        <div className="max-w-6xl w-full grid grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <div className="w-16 h-1 bg-blue-500 mb-6"></div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Lost something on campus?
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed mb-8">
                Connect with your community to reunite with lost items. Our platform makes it easy to report, search, and recover belongings through smart matching technology.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={handleGetStarted}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Try ReFind
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&h=687&q=80" 
                alt="Lost and found items" 
                className="w-80 h-80 object-cover rounded-2xl shadow-2xl border border-gray-700"
              />
              <div className="absolute inset-0 bg-gray-900/20 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="text-2xl font-bold text-gray-600">
          ReFind
          <span className="text-xs align-super">™</span>
        </div>
      </div>
    </div>
  );
}

export default App;

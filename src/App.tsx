import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { Dashboard } from "./components/Dashboard";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Unauthenticated>
          <div className="min-h-screen flex items-center justify-center">
            <SignInForm />
          </div>
        </Unauthenticated>
        <Authenticated>
          <Dashboard />
        </Authenticated>
      </div>
    </ThemeProvider>
  );
}

export default App;

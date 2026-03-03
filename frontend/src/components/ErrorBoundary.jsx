import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You could log to an external service here
    // console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-xl mx-auto">
          <h1 className="text-xl font-semibold text-red-600">Something went wrong.</h1>
          <p className="text-gray-700 mt-2">Please reload the page or navigate back.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

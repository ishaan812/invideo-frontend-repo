import React, { useState, useEffect } from 'react';
import init, { calculate } from 'rust-calc';

const Calculator: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        await init();
        setIsLoading(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        setError('Failed to load calculator');
        setIsLoading(false);
      }
    };
    loadWasm();
  }, []);

  const handleCalculate = () => {
    try {
      const calculationResult = calculate(expression);
      setResult(calculationResult.toString());
      setError('');
    } catch (err) {
      setError((err as Error).toString());
      setResult('');
    }
  };

  if (isLoading) {
    return <div>Loading calculator...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Rust Calculator</h2>
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="Enter expression (e.g., 2+2, 3*4, (5+7)/2)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCalculate();
              }
            }}
          />
          <button
            onClick={handleCalculate}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Calculate
          </button>
        </div>
        
        {result && (
          <div className="p-4 bg-green-50 rounded-md">
            <p className="text-green-700">Result: {result}</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calculator; 
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Wand2 } from 'lucide-react';

interface ShaderError {
  message: string;
  type: 'api' | 'webgl';
}

const Skeleton = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 background-animate rounded-lg ${className}`}
    {...props}
  />
);

const EmptyState = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50 bg-opacity-20 rounded-lg transition-all duration-300">
    <Wand2 className="w-12 h-12 mb-3 animate-pulse" />
    <p className="text-lg font-medium">Enter a description to generate a shader</p>
    <p className="text-sm mt-2 text-gray-500">Try "flowing lava" or "rainbow waves"</p>
  </div>
);

const LoadingState = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 rounded-lg transition-all duration-300">
    <div className="relative">
      <Skeleton className="w-64 h-64 rounded-lg" />
      <Loader2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-blue-500 animate-spin" />
    </div>
    <p className="mt-4 text-gray-600 font-medium animate-pulse">Generating your shader...</p>
  </div>
);

export function Shader() {
  const [prompt, setPrompt] = useState('');
  const [shaderCode, setShaderCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ShaderError | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const handleGenerateShader = async () => {
    if (!prompt.trim()) {
      setError({ message: 'Please enter a shader description', type: 'api' });
      return;
    }
    setIsLoading(true);
    setError(null);
    setShaderCode(null);
    try {
      const response = await fetch('http://localhost:4000/api/generate-shader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.shader) {
        throw new Error('No shader code in response');
      }
      setShaderCode(data.shader);
    } catch (err) {
      setError({ 
        message: err instanceof Error ? err.message : 'Failed to generate shader',
        type: 'api'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!shaderCode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    if (!gl) {
      setError({ message: 'WebGL not supported', type: 'webgl' });
      return;
    }
    
    // Split shader code
    const [vertexSource, fragmentSource] = shaderCode.split('// FRAGMENT_SHADER_START');
    if (!vertexSource || !fragmentSource) {
      setError({ message: 'Invalid shader format', type: 'webgl' });
      return;
    }

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      setError({ message: 'Failed to create shaders', type: 'webgl' });
      return;
    }

    // Compile shaders
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(vertexShader);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      setError({ message: `Vertex shader error: ${error}`, type: 'webgl' });
      return;
    }

    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(fragmentShader);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      setError({ message: `Fragment shader error: ${error}`, type: 'webgl' });
      return;
    }

    // Create and link program
    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      setError({ message: 'Failed to create shader program', type: 'webgl' });
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      setError({ message: `Linking error: ${error}`, type: 'webgl' });
      return;
    }

    // Set up attributes and uniforms
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');

    // Create and bind position buffer
    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      setError({ message: 'Failed to create position buffer', type: 'webgl' });
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const startTime = performance.now();

    // Animation loop
    function render() {
      if (!gl || gl.isContextLost()) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }

      const time = (performance.now() - startTime) * 0.001;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(program);

      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      if (resolutionLocation) {
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
      }
      if (timeLocation) {
        gl.uniform1f(timeLocation, time);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameRef.current = requestAnimationFrame(render);
    }

    render();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gl.isContextLost()) return;
      
      if (program && gl.isProgram(program)) {
        gl.deleteProgram(program);
      }
      if (vertexShader && gl.isShader(vertexShader)) {
        gl.deleteShader(vertexShader);
      }
      if (fragmentShader && gl.isShader(fragmentShader)) {
        gl.deleteShader(fragmentShader);
      }
      if (positionBuffer && gl.isBuffer(positionBuffer)) {
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, [shaderCode]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the shader (e.g., flowing lava, rainbow waves)"
          className="flex-1 p-2 border rounded transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
          disabled={isLoading}
        />
        <button
          onClick={handleGenerateShader}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Working...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>Generate</span>
            </>
          )}
        </button>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full aspect-video bg-black rounded-lg shadow-lg transition-opacity duration-300"
        />
        {!shaderCode && !isLoading && !error && <EmptyState />}
        {isLoading && <LoadingState />}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg animate-fadeIn">
          <p className="font-medium">{error.type === 'api' ? 'API Error' : 'WebGL Error'}</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}

      <div className="relative rounded-lg overflow-hidden transition-all duration-300">
        {isLoading ? (
          <Skeleton className="w-full h-32" />
        ) : (
          <pre className="p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto transition-all duration-300 text-sm">
            {shaderCode || 'Generated shader code will appear here...'}
          </pre>
        )}
      </div>
    </div>
  );
} 
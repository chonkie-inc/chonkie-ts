declare module '*.wasm' {
  const value: string; // The path to the wasm file or its content depending on the bundler
  export default value;
} 
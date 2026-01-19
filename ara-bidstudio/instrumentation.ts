// This file is required to enable Mastra telemetry outside of the mastra server environment
// It sets up OpenTelemetry SDK and disables the Mastra telemetry warning

// Mark that telemetry has been properly configured
globalThis.___MASTRA_TELEMETRY___ = true;

export async function register() {
  // Only run instrumentation in Node.js environment (server-side)
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    // Dynamic import to avoid loading OpenTelemetry on the client side
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const { ConsoleSpanExporter } = await import('@opentelemetry/sdk-trace-base');
    
    const sdk = new NodeSDK({
      // Use console exporter for development - you can change this to OTLP later
      traceExporter: new ConsoleSpanExporter(),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
    console.log('OpenTelemetry instrumentation started successfully');
  } catch (error) {
    console.warn('Failed to start OpenTelemetry instrumentation:', error);
  }
}

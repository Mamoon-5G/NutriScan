import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";

// For production, you would configure an OTLPTraceExporter here instead of ConsoleSpanExporter
// e.g., to send traces to Jaeger, Datadog, Honeycomb, etc.

if (!process.env.VERCEL) {
  const sdk = new NodeSDK({
    traceExporter: new ConsoleSpanExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        // We can disable specific auto-instrumentations here if they are too noisy
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.log("Error terminating tracing", error))
      .finally(() => process.exit(0));
  });
} else {
  console.log("Skipping OpenTelemetry initialization on Vercel environment");
}

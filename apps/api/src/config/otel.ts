import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

let sdk: NodeSDK | null = null;

export function initializeOpenTelemetry() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;

  sdk = new NodeSDK({
    resource: new Resource({ [ATTR_SERVICE_NAME]: 'budget-planner-api' }),
    traceExporter: new OTLPTraceExporter({ url: endpoint }),
    instrumentations: [new HttpInstrumentation()],
  });

  sdk.start();
}

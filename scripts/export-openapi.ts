import { NestFactory } from '@nestjs/core';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { buildSwaggerDocument } from '../src/swagger/swagger.config';

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const document = buildSwaggerDocument(app);
  const json = JSON.stringify(document, null, 2);

  const rootPath = join(process.cwd(), 'openapi.json');
  const docsDir = join(process.cwd(), 'docs');
  const docsPath = join(docsDir, 'openapi.json');

  mkdirSync(docsDir, { recursive: true });
  writeFileSync(rootPath, json);
  writeFileSync(docsPath, json);

  await app.close();

  console.log(`OpenAPI exported to:`);
  console.log(`  - ${rootPath}`);
  console.log(`  - ${docsPath}`);
}

exportOpenApi().catch((error) => {
  console.error('Failed to export OpenAPI:', error);
  process.exit(1);
});

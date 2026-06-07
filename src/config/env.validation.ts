import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  GOOGLE_CALLBACK_URL?: string;

  @IsUrl({ require_tld: false })
  APP_URL!: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsString()
  SWAGGER_ENABLED?: string;

  @IsOptional()
  @IsString()
  SEED_ADMIN?: string;

  @IsOptional()
  @IsString()
  ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;

  @IsOptional()
  @IsString()
  PORT?: string;
}

export function validate(config: Record<string, unknown>) {
  const nodeEnv = (config.NODE_ENV as string) ?? 'development';
  const isProduction = nodeEnv === 'production';

  const railwayDomain = config.RAILWAY_PUBLIC_DOMAIN as string | undefined;
  const defaultAppUrl = railwayDomain
    ? `https://${railwayDomain}`
    : 'http://localhost:3000';

  const normalized = {
    ...config,
    NODE_ENV: nodeEnv,
    APP_URL: config.APP_URL ?? defaultAppUrl,
    JWT_ACCESS_SECRET:
      config.JWT_ACCESS_SECRET ?? 'dev-access-secret-min-32-chars-long!!',
    JWT_REFRESH_SECRET:
      config.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-min-32-chars-long!!',
  };

  if (!isProduction) {
    return normalized;
  }

  const validated = plainToInstance(EnvironmentVariables, normalized, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}

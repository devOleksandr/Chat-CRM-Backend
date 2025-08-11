export const getCorsOrigins = (): string[] => {
  const envOrigins = process.env.FRONTEND_ORIGINS;
  const frontendUrl = process.env.FRONTEND_URL;

  if (envOrigins && envOrigins.trim().length > 0) {
    return envOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  if (frontendUrl && frontendUrl.trim().length > 0) {
    return [frontendUrl.trim()];
  }

  return [
    // Web frontend (localhost)
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8080',
    // Network access (example LAN IP)
    'http://192.168.0.101:3000',
    'http://192.168.0.101:3001',
    'http://192.168.0.101:5173',
    'http://192.168.0.101:8080',
    // Mobile emulators
    'http://10.0.2.2:3000', // Android emulator
    'http://10.0.2.2:3001',
    'http://10.0.2.2:5173',
    'http://10.0.2.2:8080',
    // iOS simulator (uses localhost)
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8080',
  ];
};



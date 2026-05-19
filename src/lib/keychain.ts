import * as Keychain from 'react-native-keychain';

const SERVICE_NAME = 'rn_cli_boilerplate';

export async function getToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE_NAME });
  if (credentials) {
    return credentials.password;
  }
  return null;
}

export async function setToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('auth_token', token, { service: SERVICE_NAME });
}

export async function removeToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE_NAME });
}

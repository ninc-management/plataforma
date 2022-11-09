import { DEFAULT_CONFIG } from '../services/config.service';

import { PlatformConfig } from '@models/platformConfig';

const defaultConfig = DEFAULT_CONFIG as any;
defaultConfig._id = '0';

export const externalMockedConfigs: PlatformConfig[] = [defaultConfig as PlatformConfig];

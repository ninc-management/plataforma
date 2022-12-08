import { DEFAULT_CONFIG } from '../services/config.service';
import { externalMockedCompanies } from './mocked-companies';

import { PlatformConfig } from '@models/platformConfig';

const defaultConfig = DEFAULT_CONFIG as any;
defaultConfig._id = '0';
defaultConfig.company = externalMockedCompanies[0]._id;

export const externalMockedConfigs: PlatformConfig[] = [defaultConfig as PlatformConfig];

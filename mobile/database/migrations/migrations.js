import journal from './meta/_journal.json';
import m0000 from './0000_damp_mulholland_black.sql';
import m0001 from './0001_account_sync_metadata.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
  },
};

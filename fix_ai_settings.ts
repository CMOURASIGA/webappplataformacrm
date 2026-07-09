import db from './src/db/index';
import 'dotenv/config';

const defaultModel = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';

// Update ai_settings
db.prepare("UPDATE ai_settings SET model = ? WHERE model = 'gpt-4o-mini'").run(defaultModel);

console.log("Updated ai_settings to use", defaultModel);

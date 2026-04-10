const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const lines = env.split('\n');
const getVal = (key) => lines.find(l => l.startsWith(key))?.split('=')[1]?.trim();

const url = getVal('NEXT_PUBLIC_SUPABASE_URL');
const key = getVal('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase
    .from('messages')
    .select('content, role, sent_at')
    .order('sent_at', { ascending: false })
    .limit(5);
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
check();

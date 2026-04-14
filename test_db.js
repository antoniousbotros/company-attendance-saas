const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: team, error: teamErr } = await supabase.from('teams').select('id').limit(1).single();
    console.log("Team:", team, teamErr);
    
    if (team) {
       const { data, error } = await supabase.from('custom_fields').insert({
           team_id: team.id,
           label: 'test label',
           field_type: 'number'
       }).select().single();
       console.log("Insert result:", data, error);

       if (data) {
           await supabase.from('custom_fields').delete().eq('id', data.id);
       }
    }
}
run();

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=')
    if (key && value) env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '')
})

const supabaseUrl = env.SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function check() {
    const { count, error } = await supabase
        .from('token_flows')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Connection Error:', error.message)
    } else {
        console.log('Total Rows in token_flows:', count)
    }

    const { data: sample } = await supabase
        .from('token_flows')
        .select('symbol, timeframe')
        .limit(5)

    console.log('Sample data:', sample)
}

check()

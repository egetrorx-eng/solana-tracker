
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '')
            process.env[key] = value
        }
    })
}

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

console.log('Testing Read Access with Anon Key...')
console.log(`URL: ${supabaseUrl}`)
console.log(`Key (first 10 chars): ${supabaseAnonKey.substring(0, 10)}...`)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    try {
        const { data, error } = await supabase
            .from('token_flows')
            .select('*')
            .limit(5)

        if (error) {
            console.error('❌ READ ERROR:', error.message)
            console.error('This likely means RLS policies are blocking public read access.')
            console.error('Details:', error)
        } else {
            console.log(`✅ Success! Found ${data.length} rows.`)
            if (data.length > 0) {
                console.log('Sample data:', data[0])
            } else {
                console.log('⚠️  Table is empty (but read was successful).')
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err)
    }
}

main()

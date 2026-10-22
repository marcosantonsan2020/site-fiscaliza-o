import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hjrwyrjoeakucftubxkf.supabase.co'
const supabaseKey = 'sb_publishable_pxdoIKkuUDCJCYRydeF9ig_D2ftImCW'

export const supabase = createClient(supabaseUrl, supabaseKey)
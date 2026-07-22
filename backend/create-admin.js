import { supabase } from './supabase.js';

async function createAdmin() {
  console.log('Creates an admin user via Supabase Auth...');
  
  const email = 'admin@velvetbrew.com';
  const password = 'password123';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('❌ Failed to create auth user:', error.message);
  } else {
    console.log(`✅ Authentication created for ${email}`);
    
    // Check if user is in 'staff' table, if not, insert dummy record
    const { error: dbError } = await supabase.from('staff').insert({
      id: data.user.id,
      name: 'Admin',
      email: email,
      password: 'hashed_placeholder',
      role: 'admin'
    });
    
    if (dbError) {
       console.log('⚠️ Staff table insert failed (maybe RLS policy issues):', dbError.message);
    } else {
       console.log('✅ Added to staff table.');
    }
  }
}

createAdmin();

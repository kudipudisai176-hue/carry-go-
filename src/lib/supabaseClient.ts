import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ysmmphbmkhcnpbqfmuff.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbW1waGJta2hjbnBicWZtdWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDkzMjAsImV4cCI6MjA4OTI4NTMyMH0.ccCbC8FKYHy17_Yh1V-4i9hvZY_kPTeeTTZ1Sgyz8oY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
